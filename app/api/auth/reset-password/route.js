// app/api/auth/reset-password/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/backend/config/dbConnect";
import User from "@/backend/models/user";
import { validateResetPassword } from "@/helpers/validation/schemas/auth";
import { captureException } from "@/monitoring/sentry";
import { sendPasswordResetSuccessEmail } from "@/backend/utils/emailService";
import { withIntelligentRateLimit } from "@/utils/rateLimit";

/**
 * POST /api/auth/reset-password
 * Réinitialise le mot de passe avec un token valide
 * Rate limit: Configuration intelligente personnalisée (5 tentatives par 15 minutes, protection contre attaques token)
 *
 * Headers de sécurité gérés par next.config.mjs pour /api/auth/*
 */
export const POST = withIntelligentRateLimit(
  async function (request) {
    try {
      // Connexion DB
      await dbConnect();

      // Parser les données
      let body;
      try {
        body = await request.json();
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            message: "Corps de requête invalide",
            code: "INVALID_REQUEST_BODY",
          },
          { status: 400 },
        );
      }

      // ✅ Validation avec Yup
      const validation = await validateResetPassword({
        token: body.token,
        newPassword: body.newPassword,
        confirmPassword: body.confirmPassword,
      });

      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            message: "Données invalides",
            errors: validation.errors,
            code: "VALIDATION_FAILED",
          },
          { status: 400 },
        );
      }

      const { token, newPassword } = validation.data;

      // ✅ Hasher le token pour le comparer avec la base de données
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // Rechercher l'utilisateur avec ce token ET vérifier l'expiration
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }, // Token non expiré
      }).select("+password");

      if (!user) {
        console.warn("Invalid or expired reset token attempt:", {
          hashedToken: hashedToken.substring(0, 8) + "...",
          timestamp: new Date().toISOString(),
          userAgent:
            request.headers.get("user-agent")?.substring(0, 100) || "unknown",
        });

        return NextResponse.json(
          {
            success: false,
            message:
              "Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.",
            code: "INVALID_OR_EXPIRED_TOKEN",
          },
          { status: 400 },
        );
      }

      // ✅ Vérifier si le compte est actif
      if (!user.isActive) {
        console.log("Password reset attempt on suspended account:", {
          userId: user._id,
          email: user.email?.substring(0, 3) + "***",
        });

        return NextResponse.json(
          {
            success: false,
            message: "Compte suspendu. Contactez l'administrateur.",
            code: "ACCOUNT_SUSPENDED",
          },
          { status: 403 },
        );
      }

      // ✅ Vérifier si le compte n'est pas verrouillé
      if (user.isLocked && user.isLocked()) {
        const lockUntilFormatted = new Date(user.lockUntil).toLocaleString(
          "fr-FR",
        );
        console.log("Password reset attempt on locked account:", {
          userId: user._id,
          email: user.email?.substring(0, 3) + "***",
        });

        return NextResponse.json(
          {
            success: false,
            message: `Compte temporairement verrouillé jusqu'à ${lockUntilFormatted}`,
            code: "ACCOUNT_LOCKED",
          },
          { status: 423 }, // Locked
        );
      }

      // ✅ Vérifier que le nouveau mot de passe est différent de l'ancien
      if (user.password) {
        const bcryptjs = await import("bcryptjs");
        const isSamePassword = await bcryptjs.compare(
          newPassword,
          user.password,
        );

        if (isSamePassword) {
          console.log("New password same as old password:", {
            userId: user._id,
            email: user.email?.substring(0, 3) + "***",
          });

          return NextResponse.json(
            {
              success: false,
              message:
                "Le nouveau mot de passe doit être différent de l'ancien",
              code: "SAME_PASSWORD",
            },
            { status: 400 },
          );
        }
      }

      // ✅ Log avant la mise à jour
      const oldPasswordChangedAt = user.passwordChangedAt;
      console.log("Password reset initiated:", {
        userId: user._id,
        email: user.email?.substring(0, 3) + "***",
        previousChange: oldPasswordChangedAt,
      });

      // ✅ Mettre à jour le mot de passe et nettoyer les tokens
      user.password = newPassword; // Sera hashé par le pre-save hook du modèle
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      user.loginAttempts = 0; // Réinitialiser les tentatives
      user.lockUntil = undefined; // Déverrouiller le compte si verrouillé

      await user.save();

      // ✅ Log de succès
      console.log("✅ Password reset successfully:", {
        userId: user._id,
        email: user.email?.substring(0, 3) + "***",
        previousChange: oldPasswordChangedAt,
        newChange: user.passwordChangedAt,
      });

      // ✅ NOUVEAU : Envoyer email de confirmation de changement de mot de passe
      let confirmationEmailSent = false;
      let confirmationEmailError = null;

      try {
        // Récupérer l'IP et le User-Agent pour l'email de sécurité
        const ipAddress =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          "unknown";

        const userAgent = request.headers.get("user-agent") || "unknown";

        const emailResult = await sendPasswordResetSuccessEmail(
          user.email,
          user.name,
          ipAddress,
          userAgent,
        );

        if (emailResult.success) {
          confirmationEmailSent = true;
          console.log("📧 Password reset confirmation email sent:", {
            userId: user._id,
            email: user.email?.substring(0, 3) + "***",
            messageId: emailResult.messageId,
          });
        } else {
          confirmationEmailError = emailResult.error;
          console.warn(
            "⚠️ Failed to send password reset confirmation email:",
            emailResult.error,
          );
        }
      } catch (error) {
        confirmationEmailError = error.message;
        console.error(
          "❌ Email service error during password reset confirmation:",
          error,
        );

        // Ne pas faire échouer la réinitialisation si l'email de confirmation échoue
        // Capturer pour monitoring mais continuer
        captureException(error, {
          tags: {
            component: "api",
            action: "reset-password",
            subAction: "confirmation-email",
          },
          user: { id: user._id, email: user.email?.substring(0, 3) + "***" },
          level: "warning", // Warning car ce n'est pas critique
        });
      }

      // ✅ Log de sécurité pour audit
      console.log("🔒 Security event - Password reset completed:", {
        userId: user._id,
        email: user.email?.substring(0, 3) + "***",
        timestamp: new Date().toISOString(),
        userAgent:
          request.headers.get("user-agent")?.substring(0, 100) || "unknown",
        ip:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown",
        accountUnlocked: oldPasswordChangedAt !== user.passwordChangedAt,
        confirmationEmailSent,
      });

      // ✅ Réponse de succès enrichie
      return NextResponse.json(
        {
          success: true,
          message: "Mot de passe réinitialisé avec succès",
          code: "PASSWORD_RESET_SUCCESS",
          data: {
            passwordChangedAt: user.passwordChangedAt,
            securityTokensCleared: true,
            accountUnlocked: true,
            confirmationEmailSent,
            nextStep: "/login",
            // En développement, inclure plus d'infos
            ...(process.env.NODE_ENV === "development" && {
              debug: {
                confirmationEmailSent,
                confirmationEmailError,
              },
            }),
          },
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("❌ Reset password error:", error.message);

      // ✅ Gestion d'erreur spécifique
      if (error.name === "ValidationError") {
        const validationErrors = {};
        Object.keys(error.errors).forEach((key) => {
          validationErrors[key] = error.errors[key].message;
        });

        return NextResponse.json(
          {
            success: false,
            message: "Erreurs de validation du modèle",
            errors: validationErrors,
            code: "MODEL_VALIDATION_ERROR",
          },
          { status: 400 },
        );
      }

      // ✅ Gestion des erreurs de connexion DB
      if (error.message.includes("connection")) {
        captureException(error, {
          tags: { component: "database", route: "auth/reset-password" },
          level: "error",
        });

        return NextResponse.json(
          {
            success: false,
            message: "Erreur de connexion. Veuillez réessayer.",
            code: "DATABASE_CONNECTION_ERROR",
          },
          { status: 503 }, // Service Unavailable
        );
      }

      // Capturer toutes les autres erreurs système
      captureException(error, {
        tags: { component: "api", route: "auth/reset-password" },
        level: "error",
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "Une erreur est survenue lors de la réinitialisation. Veuillez réessayer.",
          code: "INTERNAL_SERVER_ERROR",
        },
        { status: 500 },
      );
    }
  },
  {
    category: "api",
    action: "write",
    // Stratégie personnalisée pour reset-password (protection contre attaques token)
    customStrategy: {
      points: 5, // 5 tentatives maximum
      duration: 900000, // par 15 minutes
      blockDuration: 900000, // blocage de 15 minutes en cas de dépassement
      keyStrategy: "ip", // Track par IP pour détecter les attaques de force brute sur les tokens
      requireAuth: false, // Pas d'authentification requise (utilise token)
    },
    extractUserInfo: async (req) => {
      // Extraire le token du body pour le logging
      try {
        const body = await req.clone().json();
        return {
          token: body.token?.substring(0, 8) + "...", // Seulement les premiers caractères pour la sécurité
        };
      } catch {
        return {};
      }
    },
  },
);

import { NextResponse } from "next/server";
import { validateRegister } from "@/helpers/validation/schemas/auth";
import { captureException } from "@/monitoring/sentry";
import { withAuthRateLimit } from "@/utils/rateLimit";
import { auth } from "@/lib/auth";

export const POST = withAuthRateLimit(
  async function (req) {
    try {
      let userData;
      try {
        userData = await req.json();
      } catch (error) {
        return NextResponse.json(
          { success: false, message: "Corps de requête invalide" },
          { status: 400 },
        );
      }

      // Validation Yup
      const validation = await validateRegister({
        name: userData.name?.trim(),
        email: userData.email?.toLowerCase()?.trim(),
        phone: userData.phone?.trim(),
        password: userData.password,
      });

      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            message: "Données invalides",
            errors: validation.errors,
          },
          { status: 400 },
        );
      }

      // Créer l'utilisateur avec Better Auth
      const user = await auth.api.signUp.email({
        email: validation.data.email,
        password: validation.data.password,
        name: validation.data.name,
        phone: validation.data.phone,
      });

      console.log("✅ User registered successfully:", user.email);

      return NextResponse.json(
        {
          success: true,
          message: "Inscription réussie !",
          data: { user },
        },
        { status: 201 },
      );
    } catch (error) {
      console.error("❌ Registration error:", error.message);

      if (
        error.message?.includes("duplicate") ||
        error.message?.includes("already exists")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Cet email est déjà utilisé",
          },
          { status: 400 },
        );
      }

      captureException(error, {
        tags: { component: "api", route: "auth/register" },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de l'inscription",
        },
        { status: 500 },
      );
    }
  },
  {
    action: "loginSuccess",
    customStrategy: {
      points: 5,
      duration: 3600000,
      blockDuration: 3600000,
      keyStrategy: "ip+email",
      requireAuth: false,
    },
  },
);

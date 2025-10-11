import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getToken } from "next-auth/jwt";
import bcryptjs from "bcryptjs";
import dbConnect from "@/backend/config/dbConnect";
import User from "@/backend/models/user";
import { validateLogin } from "@/helpers/validation/schemas/auth";
import { captureException } from "@/monitoring/sentry";
import { withIntelligentRateLimit } from "@/utils/rateLimit";

/**
 * Configuration NextAuth avec rate limiting intelligent
 * Utilise la nouvelle version du système de rate limiting
 */
const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          // 1. Validation Yup des données d'entrée
          const validation = await validateLogin({
            email: credentials?.email || "",
            password: credentials?.password || "",
          });

          if (!validation.isValid) {
            const firstError = Object.values(validation.errors)[0];
            console.log("Login validation failed:", validation.errors);
            throw new Error(firstError || "Invalid credentials");
          }

          const { email, password } = validation.data;

          // 2. Connexion DB
          await dbConnect();

          // 3. Recherche utilisateur avec mot de passe
          const user = await User.findOne({
            email: email,
          }).select("+password");

          if (!user) {
            console.log("Login failed: User not found");
            throw new Error("Invalid email or password");
          }

          // Vérifier si le compte est verrouillé
          if (user.isLocked()) {
            const lockUntilFormatted = new Date(user.lockUntil).toLocaleString(
              "fr-FR",
            );
            console.log("Login failed: Account locked for user:", email);
            throw new Error(
              `Compte temporairement verrouillé jusqu'à ${lockUntilFormatted}`,
            );
          }

          // Vérifier si le compte est actif
          if (!user.isActive) {
            console.log("Login failed: Account suspended for user:", email);
            throw new Error("Compte suspendu. Contactez l'administrateur.");
          }

          // 4. Vérification du mot de passe
          const isPasswordValid = await bcryptjs.compare(
            password,
            user.password,
          );

          if (!isPasswordValid) {
            console.log("Login failed: Invalid password for user:", email);

            // Incrémenter tentatives échouées
            await user.incrementLoginAttempts();

            const attemptsLeft = Math.max(0, 5 - user.loginAttempts - 1);
            if (attemptsLeft > 0) {
              throw new Error(
                `Mot de passe incorrect. ${attemptsLeft} tentative(s) restante(s).`,
              );
            } else {
              throw new Error(
                "Trop de tentatives échouées. Compte temporairement verrouillé.",
              );
            }
          }

          // Connexion réussie - Reset tentatives + update lastLogin
          await user.resetLoginAttempts();

          // 5. Retourner l'utilisateur avec tous les champs utiles
          return {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role || "user",
            address: user.address,
            avatar: user.avatar,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
          };
        } catch (error) {
          console.error("Authentication error:", error.message);

          // Capturer seulement les vraies erreurs système
          const systemErrors = [
            "Database connection failed",
            "Internal server error",
            "Connection timeout",
          ];

          const isSystemError = systemErrors.some((sysErr) =>
            error.message.toLowerCase().includes(sysErr.toLowerCase()),
          );

          if (isSystemError) {
            captureException(error, {
              tags: { component: "auth", action: "login" },
              extra: { email: credentials?.email },
            });
          }

          // Renvoyer l'erreur pour NextAuth
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    // Callback JWT enrichi
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.user = {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          avatar: user.avatar,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        };

        // Marquer comme nouvelle connexion
        token.isNewLogin = true;
        token.loginTime = Date.now();

        // Mettre à jour lastLogin en base de données
        try {
          await dbConnect();
          await User.findByIdAndUpdate(user._id, {
            lastLogin: new Date(),
            $unset: { lockUntil: 1 }, // Nettoyer le verrou
            loginAttempts: 0,
          });
        } catch (error) {
          console.error("Failed to update lastLogin:", error);
          captureException(error, {
            tags: { component: "auth", action: "lastLogin-update" },
            user: { id: user._id, email: user.email },
          });
        }
      }

      // Marquer que ce n'est plus une nouvelle connexion après 5 secondes
      if (token.loginTime && Date.now() - token.loginTime > 5000) {
        token.isNewLogin = false;
      }

      // ✅ IMPORTANT: Gérer le trigger "update"
      if (trigger === "update" && session) {
        token.user = {
          // Mettre à jour le token avec les nouvelles données
          name: session.name || token.user.name,
          phone: session.phone || token.user.phone,
          avatar: session.avatar || token.user.avatar,
          address: session.address || token.user.address,
          _id: token.user._id,
          email: token.user.email,
          role: token.user.role,
          isActive: token.user.isActive,
          lastLogin: token.user.lastLogin,
          createdAt: token.user.createdAt,
        };

        // Optionnel: Récupérer les données fraîches de la DB
        if (token.user._id) {
          try {
            await dbConnect();
            const freshUser = await User.findById(token.user._id).select(
              "-password",
            );
            if (freshUser) {
              token.user = {
                _id: freshUser._id,
                name: freshUser.name,
                email: freshUser.email,
                phone: freshUser.phone,
                address: freshUser.address,
                role: freshUser.role,
                avatar: freshUser.avatar,
                isActive: freshUser.isActive,
                lastLogin: freshUser.lastLogin,
                createdAt: freshUser.createdAt,
              };
            }
          } catch (error) {
            console.error("Error fetching fresh user data:", error);
          }
        }
      }

      return token;
    },

    // Session enrichie avec plus de données
    session: async ({ session, token }) => {
      if (token?.user) {
        session.user = {
          ...token.user,
          // Informations supplémentaires pour l'interface
          memberSince: token.user.createdAt,
          accountStatus: token.user.isActive ? "active" : "suspended",
        };
        session.isNewLogin = token.isNewLogin || false;
      }
      return session;
    },

    // Callback redirect inchangé
    redirect: async ({ url, baseUrl }) => {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // Cookies sécurisés avec options étendues
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Secure-next-auth.session-token`
          : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60, // 24 heures
      },
    },
  },

  // Configuration de session JWT
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 heures
    updateAge: 24 * 60 * 60, // Mettre à jour toutes les 24 heures
  },

  // Pages personnalisées
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  // Secret pour JWT
  secret: process.env.NEXTAUTH_SECRET,

  // Debug seulement en développement
  debug: process.env.NODE_ENV === "development",
  useSecureCookies: process.env.NODE_ENV === "production",

  // Events pour tracking
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User signed in: ${user.email}`);
      // Optionnel: Log analytics ou événements personnalisés
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.user?.email}`);
    },
  },
};

// Créer le handler NextAuth de base
const baseHandler = NextAuth(authOptions);

/**
 * Handler GET - Pour les checks de session, CSRF tokens, etc.
 * Utilise l'action 'session' qui est très permissive (200 requêtes/minute)
 */
export const GET = withIntelligentRateLimit(
  async (req, ...args) => {
    return baseHandler(req, ...args);
  },
  {
    category: "auth",
    action: "session",
    extractUserInfo: async (req) => {
      try {
        const cookieName =
          process.env.NODE_ENV === "production"
            ? "__Secure-next-auth.session-token"
            : "next-auth.session-token";

        const token = await getToken({
          req,
          secret: process.env.NEXTAUTH_SECRET,
          cookieName,
        });

        return {
          userId: token?.user?._id || token?.user?.id || token?.sub,
          email: token?.user?.email,
          sessionId: req.cookies?.get(cookieName)?.value?.substring(0, 8),
        };
      } catch (error) {
        console.error("[AUTH] Error extracting session info:", error.message);
        return {};
      }
    },
  },
);

/**
 * Handler POST - Pour login/logout avec détection intelligente
 * Rate limiting adaptatif selon succès/échec
 */
export const POST = withIntelligentRateLimit(
  async (req, ...args) => {
    const reqClone = req.clone();
    const response = await baseHandler(req, ...args);

    // Détecter si c'est une tentative de login et son résultat
    try {
      const url = new URL(reqClone.url);
      const pathname = url.pathname;

      if (
        pathname.includes("/callback/credentials") ||
        pathname.includes("/signin")
      ) {
        const body = await reqClone.text();
        const email = body.match(/email=([^&]*)/)?.[1];

        if (email) {
          const decodedEmail = decodeURIComponent(email);
          const isSuccess =
            response.status === 200 ||
            response.status === 302 ||
            response.status === 307;

          // Informer le rate limiter du résultat
          if (isSuccess) {
            console.log(`[AUTH] Login successful for: ${decodedEmail}`);
          } else {
            console.log(`[AUTH] Login failed for: ${decodedEmail}`);
          }
        }
      }
    } catch (error) {
      console.error("[AUTH] Error detecting login result:", error.message);
    }

    return response;
  },
  {
    category: "auth",
    action: "loginSuccess", // Action par défaut
    extractUserInfo: async (req) => {
      try {
        const body = await req.clone().text();
        const email = body.match(/email=([^&]*)/)?.[1];

        // Essayer d'extraire le token pour les sessions existantes
        const cookieName =
          process.env.NODE_ENV === "production"
            ? "__Secure-next-auth.session-token"
            : "next-auth.session-token";

        const token = await getToken({
          req,
          secret: process.env.NEXTAUTH_SECRET,
          cookieName,
        });

        return {
          email: email ? decodeURIComponent(email) : null,
          userId: token?.user?._id || token?.user?.id || token?.sub,
        };
      } catch (error) {
        console.error("[AUTH] Error extracting login info:", error.message);
        return {};
      }
    },
    onFailure: async (userInfo) => {
      if (userInfo.email) {
        console.warn(`[AUTH] Rate limit reached for: ${userInfo.email}`);
      }
    },
  },
);

// Export de authOptions pour utilisation dans d'autres fichiers
export { authOptions as auth };

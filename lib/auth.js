import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import dbConnect from "@/config/dbConnect"; // Ton fichier de connexion

// Initialiser la connexion Mongoose
await dbConnect();

// Récupérer le client MongoDB natif depuis Mongoose
const mongooseConnection = (await dbConnect()).connection;
const nativeClient = mongooseConnection.getClient(); // Récupère MongoClient
const db = nativeClient.db(); // Récupère l'instance de la DB

export const auth = betterAuth({
  database: mongodbAdapter(db),

  // Email/Password avec validation stricte
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 100,

    // Validation personnalisée du mot de passe
    password: {
      validate: (password) => {
        const regex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!regex.test(password)) {
          throw new Error(
            "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial",
          );
        }
      },
    },
  },

  // Champs additionnels utilisateur (mapping avec ton ancien modèle)
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: true,
        input: true,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // Géré par le système
      },
      address: {
        type: "object",
        required: false,
        defaultValue: { street: "", city: "", country: "" },
        input: true,
      },
      avatar: {
        type: "object",
        required: false,
        defaultValue: { public_id: null, url: null },
        input: true,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
      lastLogin: {
        type: "date",
        required: false,
        defaultValue: null,
        input: false,
      },
      loginAttempts: {
        type: "number",
        required: false,
        defaultValue: 0,
        input: false,
      },
      lockUntil: {
        type: "date",
        required: false,
        defaultValue: null,
        input: false,
      },
    },
  },

  // Configuration session (24h comme ton ancien système)
  session: {
    expiresIn: 60 * 60 * 24, // 24 heures
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Hooks pour logique métier personnalisée
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Validation du nom
          if (user.name && !/^[a-zA-Z0-9\s._-]+$/.test(user.name)) {
            throw new Error("Le nom contient des caractères invalides");
          }

          // Validation du téléphone
          if (
            user.phone &&
            !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/.test(
              user.phone,
            )
          ) {
            throw new Error("Numéro de téléphone invalide");
          }

          return { data: user };
        },

        after: async (user) => {
          console.log(`✅ Utilisateur créé: ${user.email}`);
          // Ici tu pourrais envoyer un email de bienvenue
        },
      },

      update: {
        before: async (data, ctx) => {
          // Vérifier si le compte est verrouillé
          if (data.lockUntil && new Date(data.lockUntil) > new Date()) {
            throw new Error("Compte temporairement verrouillé");
          }

          return { data };
        },
      },
    },

    session: {
      create: {
        after: async (session) => {
          // Mettre à jour lastLogin et réinitialiser les tentatives
          await db.collection("user").updateOne(
            { id: session.userId },
            {
              $set: {
                lastLogin: new Date(),
                loginAttempts: 0,
              },
              $unset: { lockUntil: 1 },
            },
          );
        },
      },
    },
  },

  // Rate limiting intégré (remplace une partie de ton système)
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 10, // 10 tentatives
  },

  // Sécurité des cookies
  advanced: {
    cookiePrefix: process.env.NODE_ENV === "production" ? "__Secure-" : "",
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  trustedOrigins: [process.env.NEXTAUTH_URL || "http://localhost:3000"],

  secret: process.env.NEXTAUTH_SECRET,
});

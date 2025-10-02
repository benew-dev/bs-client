import { NextResponse } from "next/server";
import dbConnect from "@/backend/config/dbConnect";
import isAuthenticatedUser from "@/backend/middlewares/auth";
import User from "@/backend/models/user";
import { validateProfile } from "@/helpers/validation/schemas/user";
import { captureException } from "@/monitoring/sentry";
import { withApiRateLimit } from "@/utils/rateLimit";

/**
 * PUT /api/auth/me/update
 * Met à jour le profil utilisateur AVEC adresse
 */
export const PUT = withApiRateLimit(
  async function (req) {
    try {
      await isAuthenticatedUser(req, NextResponse);
      await dbConnect();

      const user = await User.findOne({ email: req.user.email });
      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 },
        );
      }

      let profileData;
      try {
        profileData = await req.json();
      } catch (error) {
        return NextResponse.json(
          { success: false, message: "Invalid request body" },
          { status: 400 },
        );
      }

      // Validation avec Yup (inclut maintenant l'adresse)
      const validation = await validateProfile(profileData);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            message: "Validation failed",
            errors: validation.errors,
          },
          { status: 400 },
        );
      }

      // MODIFIÉ: Champs autorisés incluent maintenant l'adresse
      const allowedFields = ["name", "phone", "avatar", "address"];
      const updateData = {};

      allowedFields.forEach((field) => {
        if (validation.data[field] !== undefined) {
          updateData[field] = validation.data[field];
        }
      });

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { success: false, message: "No fields to update" },
          { status: 400 },
        );
      }

      const updatedUser = await User.findOneAndUpdate(
        { email: req.user.email },
        updateData,
        {
          new: true,
          runValidators: true,
          select: "-password",
        },
      );

      if (!updatedUser) {
        return NextResponse.json(
          { success: false, message: "Update failed" },
          { status: 500 },
        );
      }

      // MODIFIÉ: Réponse inclut maintenant l'adresse
      return NextResponse.json(
        {
          success: true,
          message: "Profile updated successfully",
          data: {
            updatedUser: {
              _id: updatedUser._id,
              name: updatedUser.name,
              email: updatedUser.email,
              phone: updatedUser.phone,
              avatar: updatedUser.avatar,
              address: updatedUser.address, // NOUVEAU
              role: updatedUser.role,
              isActive: updatedUser.isActive || false,
            },
          },
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("Profile update error:", error.message);

      if (error.name !== "ValidationError") {
        captureException(error, {
          tags: { component: "api", route: "auth/me/update" },
        });
      }

      return NextResponse.json(
        {
          success: false,
          message:
            error.name === "ValidationError"
              ? "Invalid profile data"
              : "Something went wrong",
        },
        { status: error.name === "ValidationError" ? 400 : 500 },
      );
    }
  },
  {
    customLimit: {
      points: 20,
      duration: 300000,
      blockDuration: 600000,
    },
  },
);

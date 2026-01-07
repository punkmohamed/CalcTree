import mongoose, { Schema, Types } from "mongoose";
import { Role, User } from "../interfaces/user";

const userSchema: Schema<User> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    profileImage: { type: String, default: "" },
    phoneNumber: { type: String },
    role: { type: String, enum: Object.values(Role), default: "user" },

    googleId: { type: String },
  },
  { versionKey: false, timestamps: true }
);

userSchema.index({ email: 1, status: 1 });

const userModel = mongoose.model<User>("User", userSchema);

export default userModel;

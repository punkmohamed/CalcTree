import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "password and confirmation password do not match",
  path: ["confirmPassword"],
}).strict()

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
}).strict()

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name must be at least 1 character").optional(),
  profileImage: z.string().trim().optional(),
  phoneNumber: z.string().trim().optional(),
}).strict()

export const changePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New password and confirmation password do not match",
  path: ["confirmPassword"],
}).refine((data) => data.newPassword !== data.oldPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
}).strict()

export const requestPasswordResetOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
}).strict()

export const validateOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
}).strict()

export const confirmPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmNewPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New password and confirmation password do not match",
  path: ["confirmNewPassword"],
}).strict()

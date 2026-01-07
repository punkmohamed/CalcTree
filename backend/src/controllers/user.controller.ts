import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import userModel from "./../models/User";

import {
  registerSchema,
  loginSchema,
} from "../schemaValidation/user";
import {

  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpiryInMs,
} from "../utils/generateToken";

import jwt from "jsonwebtoken";
import { cookiesOptions } from "../utils/cookiesOptions";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("[REGISTER] Incoming request body:", req.body);
    // Validate request body
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      console.log("[REGISTER] Validation failed:", result.error.issues);
      return res
        .status(400)
        .json({ error: result.error.issues.map((e) => e.message) });
    }
    const { name, email, password } = result.data;
    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      if (existingUser.googleId || existingUser.facebookId) {
        return res.status(400).json({ 
          message: "Account already exists via social login. Please sign in with Google/Facebook." 
        });
      }
      console.log("[REGISTER] User already exists:", email);
      return res.status(400).json({ error: "User already exists" });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
    console.log("[REGISTER] User created:", email);


    return res.status(201).json({
      message:
        "User registered successfully.",
    });
  } catch (error: any) {
    console.error("[REGISTER] Error:", error);
    next({ statusCode: 400, message: error.message || "Something Went Wrong" });
  }
};


export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("[SIGN IN] Incoming request body:", req.body);


    const { email, password } = req.body;

    // Check if user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      console.log("[SIGN IN] User not found:", email);
      return res.status(401).json({ error: "Invalid email or password" });
    }



    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      
      console.log("[SIGN IN] Invalid password for user:", email);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check session limit
    const userId = user._id.toString();



    const accessToken = generateAccessToken(userId, user.role);
    const refreshToken = generateRefreshToken(userId);

    console.log("[SIGN IN] Tokens generated for user:", email);



    const accessTokenExpiry = getTokenExpiryInMs(
      process.env.JWT_EXPIRATION_TIME || "1h"
    );
    const refreshTokenExpiry = getTokenExpiryInMs(
      process.env.JWT_REFRESH_EXPIRATION_TIME || "7d"
    );

    res.cookie("accessToken", accessToken, {
      ...cookiesOptions,
      maxAge: accessTokenExpiry, 
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookiesOptions,
      maxAge: refreshTokenExpiry, 
    });

    console.log("[SIGN IN] User signed in successfully:", email);

    return res.status(200).json({
      message: "Sign in successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },

    });
  } catch (error: any) {
    console.error("[SIGN IN] Error:", error);
    next({ statusCode: 400, message: error.message || "Something Went Wrong" });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("[REFRESH TOKEN] Processing refresh token request");

    // Get refresh token from cookies
    const refreshTokenFromCookie = req.cookies.refreshToken;

    if (!refreshTokenFromCookie) {
      console.log("[REFRESH TOKEN] No refresh token found in cookies");
      return next({ 
        statusCode: 401, 
        message: "Your session has expired. Please sign in again.",
        code: "REFRESH_TOKEN_NOT_FOUND"
      });
    }

    // Verify refresh token
    let decodedToken;
    try {
      decodedToken = verifyRefreshToken(refreshTokenFromCookie);
      console.log(
        "[REFRESH TOKEN] Token verified for user:",
        decodedToken.userId
      );
    } catch (error: any) {
      console.log("[REFRESH TOKEN] Token verification failed:", error.message);
      
      if (error.message === 'Refresh token has expired') {
        return next({ 
          statusCode: 401, 
          message: error.message,
          code: "REFRESH_EXPIRED"
        });
      }
      
      return next({ 
        statusCode: 401, 
        message: error.message,
        code: "INVALID_REFRESH_TOKEN"
      });
    }

    // Check if user still exists and is active
    const user = await userModel.findById(decodedToken.userId);
    if (!user) {
      console.log("[REFRESH TOKEN] User not found:", decodedToken.userId);
      return res.status(401).json({ error: "User not found" });
    }



    const newAccessToken = generateAccessToken(
      user._id.toString(),
      user.role
    );

    console.log(
      "[REFRESH TOKEN] New access token generated for user:",
      user.email
    );


    // Set new access token cookie with same expiry as JWT
    const accessTokenExpiry = getTokenExpiryInMs(
      process.env.JWT_EXPIRATION_TIME || "1h"
    );

    const cookieOptions = {
      ...cookiesOptions,
      maxAge: accessTokenExpiry,
    };

    res.cookie("accessToken", newAccessToken, cookieOptions);

    return res.status(200).json({
      message: "Access token refreshed successfully",
    });
  } catch (error: any) {
    console.error("[REFRESH TOKEN] Error:", error);
    next({ statusCode: 400, message: error.message || "Something Went Wrong" });
  }
};

export const signOut = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("[SIGN OUT] Processing sign out request");

    const accessToken = req.cookies?.accessToken;

    if (accessToken) {
      try {
        const decoded = jwt.verify(
          accessToken,
          process.env.JWT_SECRET as string
        ) as any;
      } catch (error) {
        console.log("[SIGN OUT] Could not decode token for session cleanup");
      }
    }


    // Clear both access and refresh token cookies
    res.clearCookie("accessToken", cookiesOptions);

    res.clearCookie("refreshToken", cookiesOptions);

    console.log("[SIGN OUT] Cookies cleared successfully");

    return res.status(200).json({
      message: "Signed out successfully",
    });
  } catch (error: any) {
    console.error("[SIGN OUT] Error:", error);
    next({ statusCode: 400, message: error.message || "Something Went Wrong" });
  }
};



export const authMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await userModel
      .findById(userId)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }


  
    return res.status(200).json({
      message: "User info retrieved successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message || "Something Went Wrong" });
  }
};

export const OAuthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const oauthUser: any = req.user;
    console.log("[GOOGLE CALLBACK] req.user:", req.user);
    res.clearCookie("oauth_state", { ...cookiesOptions, maxAge: 0 });
    const {email}= oauthUser
    if (!oauthUser) {
      console.log("[GOOGLE CALLBACK] No req.user");
      return res.status(401).json({ error: "Authentication failed" });
    }
    console.log("[GOOGLE CALLBACK] OAuth user email:", oauthUser.email);
    const user = await userModel.findOne({email });
    if (!user) {
      console.log("[SIGN IN] User not found:", email);
      console.log("[GOOGLE CALLBACK] User not found in DB for email:", oauthUser.email);
      return res.status(401).json({ error: "Authentication failed" });
    }
    console.log("[GOOGLE CALLBACK] User found, status:", user.status);
    // Check account status

    
    const userId = oauthUser._id.toString();



    const accessToken = generateAccessToken(userId, oauthUser.role);
    const refreshTokenValue = generateRefreshToken(userId);


    const accessTokenExpiry = getTokenExpiryInMs(
      process.env.JWT_EXPIRATION_TIME || "1h"
    );
    const refreshTokenExpiry = getTokenExpiryInMs(
      process.env.JWT_REFRESH_EXPIRATION_TIME || "7d"
    );

    res.cookie("accessToken", accessToken, {
      ...cookiesOptions,
      maxAge: accessTokenExpiry,
    });
    res.cookie("refreshToken", refreshTokenValue, {
      ...cookiesOptions,
      maxAge: refreshTokenExpiry,
    });
  console.log("[GOOGLE CALLBACK] About to redirect to frontend");
   return res.redirect(`${process.env.CLIENT_URL}/`);
   
  } catch (error: any) {
    console.error("[GOOGLE CALLBACK] ERROR:", error);
    next({ statusCode: 400, message: error.message || "Something Went Wrong" });
  }
};

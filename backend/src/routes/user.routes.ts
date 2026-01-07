import {
  register,
  signIn,
  refreshToken,
  signOut,

  authMe,
  OAuthCallback
} from "../controllers/user.controller";
import { authorize } from "../middleware/authorization";
import express, { RequestHandler } from "express";
import passport from "passport";
import crypto from "crypto";
import { cookiesOptions } from "../utils/cookiesOptions";


const userRoutes = express.Router();

userRoutes.post("/signup", register as RequestHandler);

userRoutes.post("/signin", signIn as RequestHandler);
userRoutes.post("/refresh-token", refreshToken as RequestHandler);
userRoutes.post("/signout", signOut as RequestHandler);



userRoutes.get("/me", authorize, authMe as RequestHandler);

userRoutes.get(
  "/oauth/google",
  (req, res, next) => {
    const state = crypto.randomBytes(16).toString("hex");
    res.cookie("oauth_state", state, { ...cookiesOptions, maxAge: 10 * 60 * 1000 });
    passport.authenticate("google", {
      session: false,
      scope: ["profile", "email"],
      state,
    })(req, res, next);
  }
);

userRoutes.get(
  "/oauth/google/callback",
  (req , res, next) => {
    const stateCookie = req.cookies?.oauth_state;
    const stateParam = req.query?.state;
    if (!stateCookie || stateCookie !== stateParam) {
      res.clearCookie("oauth_state", { ...cookiesOptions, maxAge: 0 });
      res.status(400).json({ error: "Invalid OAuth state" });
      return;
    }
    next();
  },
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/v0/auth/oauth/failure",
  }),
  OAuthCallback as RequestHandler
);



userRoutes.get("/oauth/failure", ((req, res) => {
  res.clearCookie("oauth_state", { ...cookiesOptions, maxAge: 0 });
  res.status(401).json({ error: "OAuth authentication failed" });
}) as RequestHandler);


export default userRoutes;

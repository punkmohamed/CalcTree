import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userModel from "../models/User";

if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  (process.env.GOOGLE_CALLBACK_URL || process.env.SERVER_URL)
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          `${process.env.SERVER_URL}/v0/auth/oauth/google/callback`,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails && profile.emails[0] ? profile.emails[0].value : "";
          const name = profile.displayName || "";
          const image =
            profile.photos && profile.photos[0] ? profile.photos[0].value : "";

          let user =
            (await userModel.findOne({ googleId: profile.id })) ||
            (email ? await userModel.findOne({ email }) : null);

          if (!user) {
            user = await userModel.create({
              name,
              email,
              googleId: profile.id,
              profileImage: image,
            });
          } else {
            const updates: any = {};
            if (!user.googleId) updates.googleId = profile.id;
            if (!user.profileImage && image) updates.profileImage = image;
            if (Object.keys(updates).length) {
              await userModel.updateOne({ _id: user._id }, updates);
              user = await userModel.findById(user._id);
            }
          }

          done(null, user || undefined);
        } catch (err) {
          done(err as any, undefined);
        }
      }
    )
  );
} else {
  console.warn(
    "[OAuth] Google strategy not initialized: missing GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL"
  );
}



passport.serializeUser(() => null);
passport.deserializeUser(() => null);


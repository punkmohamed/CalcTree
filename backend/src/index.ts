// IMPORTANT: This must be the FIRST import to load environment variables
import "./env";

import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { DBconnection } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import userRoutes from "./routes/user.routes";

import passport from "passport";
import "./services/passport-Oauth-service";

const app = express();
// app.use(express.json());


app.use(express.json());
const PORT = process.env.PORT ?? 3000;
DBconnection();

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",


  "http://localhost:5173",
  "http://localhost:3001",

];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(passport.initialize());

app.use(express.json());
//
app.get("/v0/test", (_, res: Response) => {
  res.send("Hello From Server");
});



app.use("/v1/auth", userRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});

import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import db from "./db";

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
});

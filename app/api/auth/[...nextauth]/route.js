import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/sendOtp";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";


export const authOptions = {
  providers: [
    CredentialsProvider({
  name: "Credentials",

  credentials: {
    email: {
      label: "Email",
      type: "text",
    },
    password: {
      label: "Password",
      type: "password",
    },
  },

  async authorize(credentials) {
    const email = credentials?.email?.trim();
    const password = credentials?.password;

    if (!email || !password) {
      throw new Error("Email and Password are required");
    }


 if(email=="admin@Goldy" && password=="admin@123"){
  return {
      id: 47,
      name: "Goldy",
      email: "admin@Goldy",
    };
 }


    const client = await clientPromise;
    const usersCollection = client
      .db(process.env.MONGODB_DB)
      .collection("users");


    const user = await usersCollection.findOne(
{ email: email.toLowerCase() }    
    );

    if (!user) {
      throw new Error("User does not exist");
    }

  if (!user.password) {
  throw new Error("Password not set.");
}


     

    // User not verified
//if (!user.emailVerified && !user.phoneVerified) {

//  // Email verification
//  if (isEmail) {

//    // Verification link expired -> generate new one
//    if (
//      !user.verifyTokenExpiry ||
//      user.verifyTokenExpiry.getTime() < Date.now()
//    ) {
//      const token = crypto.randomBytes(32).toString("hex");

//      await usersCollection.updateOne(
//        { _id: user._id },
//        {
//          $set: {
//            verifyToken: token,
//            verifyTokenExpiry: new Date(
//              Date.now() + 24 * 60 * 60 * 1000
//            ),
//          },
//        }
//      );

//      const verifyLink =
//        `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${token}&email=${user.email}`;

//      const msg = `
//        <div style="font-family:Arial;padding:20px">
//          <h2>Welcome 🎉</h2>

//          <p>Please verify your email.</p>

//          <a
//            href="${verifyLink}"
//            style="
//              display:inline-block;
//              padding:12px 20px;
//              background:#10b981;
//              color:#fff;
//              text-decoration:none;
//              border-radius:8px;
//            "
//          >
//            Verify Email
//          </a>

//          <p style="margin-top:20px;color:#666">
//            This link expires in 24 hours.
//          </p>
//        </div>
//      `;

//      await sendEmail(
//        user.email,
//        msg,
//        "Verify your account"
//      );
//    }

//    throw new Error("EMAIL_NOT_VERIFIED");
//  }

//  // Phone verification
//  if (!isEmail) {
//    throw new Error("PHONE_NOT_VERIFIED");
//  }
//}

  

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      throw new Error("Invalid password");
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };
  },
}),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  jwt: {
    secret: process.env.jwt_SECRET,
    maxAge: 7 * 24 * 60 * 60,
  },

  callbacks: {

    // Create user if not exists
    async signIn({ user,account }) {
        if (account.provider !== "google") {
    return true;
  }

      let userId;
      try{
      const client = await clientPromise;
      const usersCollection = client.db(process.env.MONGODB_DB).collection("users");
 
      const existingUser = await usersCollection.findOne({
        email: user.email,
      });

      if (!existingUser) {
        const result = await usersCollection.insertOne({
          name: user.name,
          email: user.email,
          password:null,
            loans: [],
          provider: "oauth",
          createdAt: new Date(),
        expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        userId = result.insertedId.toString();
      } else {
        userId = existingUser._id.toString();
      }

      // attach id for JWT
      user.id = userId;
 
      return true;
    } catch (error) {
      console.error("Error in signIn callback:", error);
      return false;
    }
    },

  async jwt({ token, user }) {
  // Runs only on login
  if (user) {
    token.id = user.id;

    // Admin expires after 1 day
    if (user.id==47 && user.password === "admin@123") {
      token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    } else {
      // Normal users expire after 7 days
      token.exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    }
  }

  // Check token expiration
  if (token.exp && Math.floor(Date.now() / 1000) >= token.exp) {
    return {};
  }

  return token;
},

    async session({ session, token }) {
      session.user.id = token.id;
   
      return session;
    },
  },

  pages: {
    signIn: "/signin",
  },

};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
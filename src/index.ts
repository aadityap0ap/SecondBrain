import express, { Request, Response } from "express";
import { contentSchema, userSchema } from "./validations/userValidations";
import { contentModel, linkModel, TagModel, UserModel } from "./db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import { authMiddleware } from "./validations/middleware";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

interface AuthRequest extends Request {
  userId?: string;
}

// Wrap everything in async function
async function startServer() {
  try {
    //  WAIT for DB connection
    await mongoose.connect(process.env.MONGO_URL!);
    console.log("MongoDB connected ✅");

    // ================= ROUTES ================= //

    app.post("/signup", async (req, res) => {
          console.log("Signup API hit");
      try {
        const result = userSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(411).json({
            message: "Invalid Inputs",
            errors: result.error.issues,
          });
        }

        const { username, password } = result.data;

        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
          return res.status(403).json({
            message: "User already existed!",
          });
        }

        const hashedPassword = await bcrypt.hash(password, 9);

        await UserModel.create({
          username,
          password: hashedPassword,
        });

        return res.status(200).json({
          message: "Signup successful ✅",
        });
      } catch (error) {
        console.log("Signup Error:", error);
        return res.status(500).json({
          message: "Server Side Error",
        });
      }
    });

    app.post("/signin", async (req, res) => {
      try {
        const { username, password } = req.body;

        const user = await UserModel.findOne({ username });
        if (!user) {
          return res.status(411).json({
            message: "Invalid username!",
          });
        }

        const isMatched = await bcrypt.compare(
          password,
          user.password as string
        );

        if (!isMatched) {
          return res.status(411).json({
            message: "Invalid Password!",
          });
        }

        const token = jwt.sign(
          { id: user._id },
          process.env.JWT_USER_PASSWORD as string
        );

        return res.status(200).json({
          message: "SignIn Successful!",
          token,
        });
      } catch (error) {
        return res.status(500).json({
          message: "Server Side Error!",
        });
      }
    });

    app.post(
      "/content",
      authMiddleware,
      async (req: AuthRequest, res: Response) => {
        try {
          const content = contentSchema.safeParse(req.body);

          if (!content.success) {
            return res.status(411).json({
              message: "Invalid Inputs",
              errors: content.error.issues,
            });
          }

          if (!req.userId) {
            return res.status(403).json({
              message: "Unauthorized",
            });
          }

          const { type, link, title, tags } = content.data;
          const tagIds: mongoose.Types.ObjectId[] = [];

          for (const tagTitle of tags) {
            let tag = await TagModel.findOne({ title: tagTitle });

            if (!tag) {
              tag = await TagModel.create({ title: tagTitle });
            }

            tagIds.push(tag._id as mongoose.Types.ObjectId);
          }

          await contentModel.create({
            type,
            link,
            title,
            tags: tagIds,
            userId: req.userId,
          });

          return res.status(200).json({
            message: "Contents Saved Successfully!",
          });
        } catch (error) {
          console.log(error);
          return res.status(500).json({
            message: "Server Side Error",
          });
        }
      }
    );

    app.get(
      "/content",
      authMiddleware,
      async (req: AuthRequest, res: Response) => {
        try {
          if (!req.userId) {
            return res.status(403).json({
              message: "Unauthorized",
            });
          }

          const contents = await contentModel
            .find({ userId: req.userId })
            .populate("tags", "title")
            .select("title link type tags");

          return res.status(200).json({
            message: "Fetched Successfully!",
            contents,
          });
        } catch (error) {
          return res.status(500).json({
            message: "Server Side Error",
          });
        }
      }
    );

    app.delete(
      "/content/:id",
      authMiddleware,
      async (req: AuthRequest, res: Response) => {
        try {
          if (!req.userId) {
            return res.status(403).json({
              message: "Unauthorized",
            });
          }

          const deleted = await contentModel.deleteOne({
            _id: req.params.id,
            userId: req.userId,
          });

          if (deleted.deletedCount === 0) {
            return res.status(404).json({
              message: "Not found or Unauthorized",
            });
          }

          return res.status(200).json({
            message: "Deleted Successfully!",
          });
        } catch {
          return res.status(500).json({
            message: "Server Error",
          });
        }
      }
    );

    app.post(
      "/brain/share",
      authMiddleware,
      async (req: AuthRequest, res: Response) => {
        try {
          if (!req.userId) {
            return res.status(403).json({
              message: "Unauthorized",
            });
          }

          const { share } = req.body;

          if (share) {
            const existingLink = await linkModel.findOne({
              userId: req.userId,
            });

            if (existingLink) {
              return res.json({
                link: `http://localhost:3000/brain/${existingLink.hash}`,
              });
            }

            const hash = crypto.randomBytes(10).toString("hex");

            await linkModel.create({
              userId: req.userId,
              hash,
            });

            return res.status(200).json({
              link: `http://localhost:3000/brain/${hash}`,
            });
          }
        } catch (error) {
          console.error(error);
          return res.status(500).json({
            message: "Server Error",
          });
        }
      }
    );

    app.get("/brain/:sharedLink", async (req, res) => {
      try {
        const link = await linkModel.findOne({
          hash: req.params.sharedLink,
        });

        if (!link) {
          return res.status(404).json({
            message: "Invalid link",
          });
        }

        const user = await UserModel.findById(link.userId);
        const contents = await contentModel.find({
          userId: link.userId,
        });

        return res.status(200).json({
          username: user?.username,
          content: contents,
        });
      } catch {
        return res.status(500).json({
          message: "Server Error",
        });
      }
    });

    // ✅ START SERVER AFTER DB
    app.listen(3000, () => {
      console.log("Server running on port 3000 🚀");
    });

  } catch (err) {
    console.error("DB connection failed ❌", err);
  }
}

startServer();
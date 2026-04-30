import mongoose, { Schema, model } from "mongoose";

const userSchema = new Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const TagSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
});

const contentSchema = new Schema({
  type: {
    type: String,
    enum: ["document", "tweet", "youtube", "link"],
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
  ],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
});

const linkSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
    unique: true,
  },
  hash: {
    type: String,
    required: true,
    unique: true,
  },
});

export const linkModel = model("Links", linkSchema);
export const TagModel = model("Tag", TagSchema);
export const contentModel = model("Content", contentSchema);
export const UserModel = model("Users", userSchema);
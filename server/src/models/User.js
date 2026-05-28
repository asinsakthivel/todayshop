import mongoose from "mongoose";
import { buildCommonUserFields } from "./shared/userCommon.js";

const userSchema = new mongoose.Schema(
  buildCommonUserFields(),
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;

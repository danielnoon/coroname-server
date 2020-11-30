import mongoose, { Schema, Document } from "mongoose";
import { Permission } from "../Permission";

export interface IUser extends Document {
  username: string;
  password: string;
  admin: boolean;
  votesAvailable: number;
  votedFor: number[];
  email: string;
  supervoteAvailable: boolean;
  permissions: Permission[];
}

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: String,
  admin: Boolean,
  votesAvailable: Number,
  votedFor: [Number],
  email: String,
  supervoteAvailable: Boolean,
  permissions: [String],
});

export const User = mongoose.model<IUser>("User", UserSchema);

export function trimUser(user: IUser) {
  return {
    username: user.username,
    admin: user.admin,
    votesAvailable: user.votesAvailable,
    votedFor: user.votedFor,
    email: user.email,
    supervoteAvaliable: user.supervoteAvailable,
    permissions: user.permissions,
  };
}

export function trimUsers(users: IUser[]) {
  return users.map((u) => trimUser(u));
}

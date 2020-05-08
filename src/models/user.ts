import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string;
  admin: boolean;
  votesAvailable: number;
  votedFor: number[];
  email: string;
  supervoteAvailable: boolean;
}

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: String,
  admin: Boolean,
  votesAvailable: Number,
  votedFor: [Number],
  email: String,
  supervoteAvailable: Boolean,
});

export const User = mongoose.model<IUser>("User", UserSchema);

export function trimUser(user: IUser) {
  return {
    username: user.username,
    admin: user.admin,
    votesAvailable: user.votesAvailable,
    votedFor: user.votedFor,
    email: user.email,
    supervoteAvailable: user.supervoteAvailable,
  };
}

export function trimUsers(users: IUser[]) {
  return users.map((u) => trimUser(u));
}

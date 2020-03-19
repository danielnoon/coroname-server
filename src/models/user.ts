import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  admin: boolean;
}

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: String,
  admin: Boolean
});

export const User = mongoose.model<IUser>('User', UserSchema);


import mongoose, { Schema, Document } from "mongoose";

export interface IUpdate extends Document {
  version: number;
}

const UpdateSchema = new Schema({
  version: { type: Number, required: true, unique: true },
});

export const Update = mongoose.model<IUpdate>("Update", UpdateSchema);

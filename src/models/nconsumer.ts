import mongoose, { Schema, Document } from "mongoose";

export interface INConsumer extends Document {
  token: string;
  user: string;
}

const NConsumerSchema = new Schema({
  token: String,
  user: Schema.Types.ObjectId,
});

export const NConsumer = mongoose.model<INConsumer>(
  "NConsumer",
  NConsumerSchema
);

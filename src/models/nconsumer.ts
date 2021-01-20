import mongoose, { Schema, Document } from "mongoose";

export interface INConsumer extends Document {
  token: string;
  user: string;
  subscribed: boolean;
}

const NConsumerSchema = new Schema({
  token: String,
  user: Schema.Types.ObjectId,
  subscribed: Boolean,
});

export const NConsumer = mongoose.model<INConsumer>(
  "NConsumer",
  NConsumerSchema
);

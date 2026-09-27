import mongoose, { Schema, Document } from "mongoose";

export interface IPolicy extends Document {
  clientId: string;
  title: string;
  content: string;
  createdAt: Date;
}

const PolicySchema: Schema = new Schema({
  clientId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

PolicySchema.index({ clientId: 1 });

export const Policy = mongoose.models.Policy || mongoose.model<IPolicy>("Policy", PolicySchema);

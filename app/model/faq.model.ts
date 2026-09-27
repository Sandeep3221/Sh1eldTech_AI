import mongoose, { Schema, Document } from "mongoose";

export interface IFaq extends Document {
  clientId: string;
  question: string;
  answer: string;
  createdAt: Date;
}

const FaqSchema: Schema = new Schema({
  clientId: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

FaqSchema.index({ clientId: 1 });

export const Faq = mongoose.models.Faq || mongoose.model<IFaq>("Faq", FaqSchema);

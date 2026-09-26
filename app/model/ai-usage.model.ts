import mongoose, { Schema, Document } from "mongoose";

export interface IAIUsage extends Document {
  clientId: string;
  feature: 'chat' | 'itinerary';
  aiModel: string;
  success: boolean;
  latencyMs: number;
  errorCategory?: string;
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  timestamp: Date;
}

const AIUsageSchema: Schema = new Schema({
  clientId: { type: String, required: true },
  feature: { type: String, enum: ['chat', 'itinerary'], required: true },
  aiModel: { type: String, required: true },
  success: { type: Boolean, required: true },
  latencyMs: { type: Number, required: true },
  errorCategory: { type: String },
  promptTokenCount: { type: Number },
  candidatesTokenCount: { type: Number },
  totalTokenCount: { type: Number },
  timestamp: { type: Date, default: Date.now },
});

export const AIUsage = mongoose.models.AIUsage || mongoose.model<IAIUsage>("AIUsage", AIUsageSchema);

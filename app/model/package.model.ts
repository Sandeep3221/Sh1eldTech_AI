import mongoose, { Schema, Document } from "mongoose";

export interface IPackage extends Document {
  clientId: string;
  title: string;
  destination: string;
  days: number;
  nights: number;
  price: number;
  description: string;
  inclusions: string[];
  exclusions: string[];
  active: boolean;
  createdAt: Date;
}

const PackageSchema: Schema = new Schema({
  clientId: { type: String, required: true },
  title: { type: String, required: true },
  destination: { type: String, required: true },
  days: { type: Number, required: true },
  nights: { type: Number, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  inclusions: { type: [String], default: [] },
  exclusions: { type: [String], default: [] },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

PackageSchema.index({ clientId: 1, active: 1 });

export const Package = mongoose.models.Package || mongoose.model<IPackage>("Package", PackageSchema);

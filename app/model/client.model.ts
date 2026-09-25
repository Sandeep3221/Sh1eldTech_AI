import mongoose, { Schema, Document } from "mongoose";

export interface IClient extends Document {
  name: string;
  clientId: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  location: string;
  businessDescription: string;
  supportEmail: string;
  chatbotEnabled: boolean;
  itineraryEnabled: boolean;
  createdAt: Date;
}

const ClientSchema: Schema = new Schema({
  name: { type: String, required: true },
  clientId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  phone: { type: String, required: false },
  whatsapp: { type: String, required: false },
  website: { type: String, required: false },
  location: { type: String, required: false },
  businessDescription: { type: String, required: false },
  supportEmail: { type: String, required: false },
  chatbotEnabled: { type: Boolean, default: false },
  itineraryEnabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Client = mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);

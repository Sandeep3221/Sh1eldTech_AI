import mongoose, { Schema, Document } from "mongoose";

export interface ILead extends Document {
  clientId: string;
  name: string;
  phone?: string;
  email?: string;
  destination?: string;
  days?: number;
  budget?: string;
  travellers?: number;
  travelDate?: string;
  interests?: string;
  message?: string;
  source: string;
  status: 'new' | 'contacted' | 'interested' | 'quotation_sent' | 'won' | 'lost';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema = new Schema({
  clientId: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  destination: { type: String },
  days: { type: Number },
  budget: { type: String },
  travellers: { type: Number },
  travelDate: { type: String },
  interests: { type: String },
  message: { type: String },
  source: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['new', 'contacted', 'interested', 'quotation_sent', 'won', 'lost'], 
    default: 'new' 
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Lead = mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IBook extends Document {
  title: string;
  author: string;
  totalPages: number;
  source: "api" | "gutenberg" | "upload";
  baseUrl?: string; // For API/Gutenberg fetched books
  gutenbergId?: string; 
  uploaderId?: string; // Optional user who uploaded it
  coverImage?: string;
  pdfUrl?: string; // If it's an uploaded PDF
  description?: string;
}

const BookSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    totalPages: { type: Number, required: true, default: 0 },
    source: { type: String, enum: ["api", "gutenberg", "upload"], required: true },
    baseUrl: { type: String },
    gutenbergId: { type: String },
    uploaderId: { type: String },
    coverImage: { type: String },
    pdfUrl: { type: String },
    description: { type: String }
  },
  { timestamps: true }
);

export const Book = mongoose.model<IBook>("Book", BookSchema);

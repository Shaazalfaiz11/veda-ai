import mongoose, { Schema, Document } from "mongoose";

export interface IUserReading extends Document {
  userId: string; // Since there is no User model currently, store as string
  bookId: mongoose.Types.ObjectId;
  lastReadPage: number;
  bookmarks: number[];
}

const UserReadingSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    lastReadPage: { type: Number, default: 1 },
    bookmarks: [{ type: Number }]
  },
  { timestamps: true }
);

// Ensure a user only has one reading progress per book
UserReadingSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export const UserReading = mongoose.model<IUserReading>("UserReading", UserReadingSchema);

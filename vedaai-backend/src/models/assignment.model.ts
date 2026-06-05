import mongoose, { Schema, Document } from "mongoose"

const QuestionSchema = new Schema(
  {
    text:       { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    marks:      { type: Number, required: true, min: 1 },
    type:       { type: String, enum: ["mcq", "short", "long"], required: true },
    options:    { type: [String], default: undefined },
  }
)

const SectionSchema = new Schema(
  {
    title:       { type: String, required: true },
    instruction: { type: String, default: "Attempt all questions" },
    questions:   { type: [QuestionSchema], default: [] },
  },
  { _id: false }
)

export interface IAssignment extends Document {
  subject:       string
  topic:         string
  totalMarks:    number
  questionTypes: string[]
  instructions:  string
  dueDate:       string | null
  status:        "pending" | "generating" | "completed" | "failed"
  result:        any[] | null
  error:         string | null
  retryCount:    number
  createdAt:     Date
  updatedAt:     Date
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    subject:       { type: String, required: true, trim: true },
    topic:         { type: String, required: true, trim: true },
    totalMarks:    { type: Number, required: true, min: 1, max: 500 },
    questionTypes: {
      type: [String],
      enum: ["mcq", "short", "long"],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "At least one question type required",
      },
    },
    instructions: { type: String, default: "Attempt all questions" },
    dueDate:      { type: String, default: null },
    status: {
      type:    String,
      enum:    ["pending", "generating", "completed", "failed"],
      default: "pending",
    },
    result: { type: Schema.Types.Mixed, default: null },
    error:  { type: String, default: null },
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Assignment = mongoose.model<IAssignment>("Assignment", AssignmentSchema)
import { z } from "zod";

export interface IdempotencyRecord {
  assignmentId?: string;
  jobId?: string;
  status: "processing" | "completed" | "failed";
  createdAt: number;
}

export const CreateAssignmentSchema = z.object({
  subject: z.string().trim().min(1, "subject is required"),
  topic: z.string().trim().min(1, "topic is required"),
  totalMarks: z.number().int("totalMarks must be a whole number").min(1, "totalMarks must be greater than 0").max(500, "totalMarks cannot exceed 500"),
  questionTypes: z.array(z.enum(["mcq", "short", "long"])).min(1, "questionTypes must be a non-empty array"),
  instructions: z.string().trim().optional(),
  dueDate: z.string().optional().nullable()
});

export type CreateAssignmentPayload = z.infer<typeof CreateAssignmentSchema>;

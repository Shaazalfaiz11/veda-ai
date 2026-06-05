import { Request, Response } from "express"
import { Assignment }        from "../models/assignment.model"
import { generationQueue }   from "../queues/generation.queue"
import { questionRegenQueue } from "../queues/questionRegen.queue"
import { CreateAssignmentSchema } from "../types/idempotency"
import { updateRecord } from "../services/idempotency.service"
import { logger } from "../utils/logger"

export const createAssignment = async (req: Request, res: Response) => {
  const parsed = CreateAssignmentSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.errors[0].message })
  }

  try {
    const assignment = await Assignment.create({
      subject:       parsed.data.subject,
      topic:         parsed.data.topic,
      totalMarks:    parsed.data.totalMarks,
      questionTypes: parsed.data.questionTypes,
      instructions:  parsed.data.instructions || "Attempt all questions",
      dueDate:       parsed.data.dueDate || null,
      status:        "generating",
    })

    const job = await generationQueue.add(
      "generate-paper",
      { assignmentId: assignment._id }
    )

    if (req.idempotencyKey) {
      await updateRecord(req.idempotencyKey, {
        assignmentId: assignment._id.toString(),
        jobId: job.id,
      })
    }

    res.status(201).json({
      message: "Assignment created. Generation started.",
      jobId:   job.id,
      data:    assignment,
    })
  } catch (error) {
    logger.error({ error }, "createAssignment error")
    res.status(500).json({ message: "Internal server error" })
  }
}

export const getAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) return res.status(404).json({ message: "Assignment not found" })
    res.json(assignment)
  } catch {
    res.status(500).json({ message: "Internal server error" })
  }
}

export const listAssignments = async (_req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find()
      .select("-result")
      .sort({ createdAt: -1 })
      .limit(50)
    res.json(assignments)
  } catch {
    res.status(500).json({ message: "Internal server error" })
  }
}

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id)
    if (!assignment) return res.status(404).json({ message: "Assignment not found" })
    res.json({ message: "Deleted successfully" })
  } catch {
    res.status(500).json({ message: "Internal server error" })
  }
}

export const regenerateQuestion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, questionId } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ success: false, error: "Assignment not found" });
      return;
    }

    let foundQuestion = null;
    let sectionIndex = -1;
    let questionIndex = -1;

    if (assignment.result) {
      for (let i = 0; i < assignment.result.length; i++) {
        const sec = assignment.result[i];
        if (sec.questions) {
          for (let j = 0; j < sec.questions.length; j++) {
            if ((sec.questions[j] as any)._id?.toString() === questionId) {
              foundQuestion = sec.questions[j];
              sectionIndex = i;
              questionIndex = j;
              break;
            }
          }
        }
        if (foundQuestion) break;
      }
    }

    if (!foundQuestion) {
      res.status(404).json({ success: false, error: "Question not found in assignment" });
      return;
    }

    await questionRegenQueue.add(
      "regenerate-question",
      { assignmentId: id, questionId, sectionIndex, questionIndex }
    );

    res.json({
      success: true,
      message: "Question regeneration queued",
    });
  } catch (error) {
    logger.error({ error }, "regenerateQuestion error")
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}
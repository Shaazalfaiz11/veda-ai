import { Router } from "express"
import {
  createAssignment,
  getAssignment,
  listAssignments,
  deleteAssignment,
  regenerateQuestion,
} from "../controllers/assignment.controller"
import { idempotencyMiddleware } from "../middleware/idempotency.middleware"

const router = Router()

router.get("/",       listAssignments)
router.post("/",      idempotencyMiddleware, createAssignment)
router.get("/:id",    getAssignment)
router.delete("/:id", deleteAssignment)
router.post("/:id/questions/:questionId/regenerate", regenerateQuestion)

export default router
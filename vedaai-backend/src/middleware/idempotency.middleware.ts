import { Request, Response, NextFunction } from "express";
import { getRecord, lockRequest } from "../services/idempotency.service";

declare module "express-serve-static-core" {
  interface Request {
    idempotencyKey?: string;
  }
}

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers["x-idempotency-key"] as string;

  if (!key) {
    return res.status(400).json({ success: false, message: "X-Idempotency-Key header is required" });
  }

  const isLocked = await lockRequest(key);

  if (!isLocked) {
    const existingRecord = await getRecord(key);
    if (!existingRecord) {
      return res.status(409).json({ message: "Conflict, please retry." });
    }
    return res.status(200).json({
      message: "Idempotent request detected",
      data: {
        _id: existingRecord.assignmentId,
        status: existingRecord.status
      },
      jobId: existingRecord.jobId
    });
  }

  req.idempotencyKey = key;
  next();
};

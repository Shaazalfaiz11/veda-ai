import { Router } from "express";
import { chatWithTutor, speakText } from "../controllers/tutor.controller";

const router = Router();

router.post("/chat", chatWithTutor);
router.post("/speak", speakText);

export default router;

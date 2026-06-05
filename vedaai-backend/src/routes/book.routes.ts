import { Router } from "express";
import { getBooks, getBookDetails, getBookPage, uploadBook } from "../controllers/book.controller";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads", "pdfs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique file name
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB limit

router.get("/", getBooks);
router.get("/:id", getBookDetails);
router.get("/:id/pages/:pageNumber", getBookPage);
router.post("/upload", upload.single("pdf"), uploadBook);

export default router;

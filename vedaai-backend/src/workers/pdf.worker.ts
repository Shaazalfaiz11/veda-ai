import "dotenv/config";
import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../config/redis";
import { Book } from "../models/Book";
import { connectDb } from "../config/db";
import { fromPath } from "pdf2pic";
import path from "path";
import fs from "fs";

connectDb();

const pdfWorker = new Worker(
  "pdf-processing",
  async (job: Job) => {
    const { bookId, pdfPath } = job.data;
    console.log(`[PDF Worker] Processing started for book ${bookId}`);

    try {
      const outputDir = path.join(process.cwd(), "uploads", "pages", bookId.toString());
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const options = {
        density: 150,
        saveFilename: "page",
        savePath: outputDir,
        format: "png",
        width: 800,
        height: 1131 // Standard A4 roughly
      };

      const convert = fromPath(pdfPath, options);
      
      // Convert all pages up to a reasonable limit, or we can use pdf-poppler/pdf-lib to count pages first
      // pdf2pic's `bulk` method takes an array or '-1' for all in latest version.
      // We will try -1 for all pages.
      const results = await convert.bulk(-1, { responseType: "image" });
      
      const totalPages = results.length;
      
      // Update book with total generated pages
      await Book.findByIdAndUpdate(bookId, { totalPages });

      console.log(`[PDF Worker] Processing complete for book ${bookId}. Total pages: ${totalPages}`);

      return { totalPages };
    } catch (error) {
      console.error(`[PDF Worker] Error processing book ${bookId}:`, error);
      throw error;
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 1, // CPU intensive task, limit concurrency
  }
);

pdfWorker.on("completed", (job) => {
  console.log(`[PDF Worker] Job ${job.id} has completed!`);
});

pdfWorker.on("failed", (job, err) => {
  console.log(`[PDF Worker] Job ${job?.id} has failed with ${err.message}`);
});

console.log("[Worker] PDF Processing Worker started");

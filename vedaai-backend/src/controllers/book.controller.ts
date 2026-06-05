import { Request, Response } from "express";
import { Book } from "../models/Book";
import { UserReading } from "../models/UserReading";
import { pdfQueue } from "../queues/pdf.queue";
import axios from "axios";
import fs from "fs";
import path from "path";

// GET /api/books
export const getBooks = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    // If query exists, we might want to search Google Books API as well and merge
    if (query) {
      const gBooksResponse = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query as string)}&maxResults=10`);
      
      const apiBooks = gBooksResponse.data.items?.map((item: any) => ({
        _id: item.id, // we might need to use google id temporarily or map it
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors?.join(", ") || "Unknown",
        totalPages: item.volumeInfo.pageCount || 100,
        source: "api",
        coverImage: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
        description: item.volumeInfo.description,
      })) || [];

      // Search local database
      const searchQuery = typeof query === 'string' ? query : '';
      const localBooks = await Book.find({ title: { $regex: searchQuery, $options: "i" } }).limit(10);
      
      return res.status(200).json({ success: true, data: [...localBooks, ...apiBooks] });
    }

    // Default: Return all local database books
    const books = await Book.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: books });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET /api/books/:id
export const getBookDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if it's a local object ID
    if (id.length === 24) {
      const book = await Book.findById(id);
      if (book) return res.status(200).json({ success: true, data: book });
    }
    
    // Otherwise, try fetching from Google Books
    const gBook = await axios.get(`https://www.googleapis.com/books/v1/volumes/${id}`);
    if (gBook.data) {
      const data = {
        _id: id,
        title: gBook.data.volumeInfo.title,
        author: gBook.data.volumeInfo.authors?.join(", ") || "Unknown",
        totalPages: gBook.data.volumeInfo.pageCount || 100,
        source: "api",
        coverImage: gBook.data.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
        description: gBook.data.volumeInfo.description,
      };
      return res.status(200).json({ success: true, data });
    }

    res.status(404).json({ success: false, message: "Book not found" });
  } catch (error) {
    console.error("Error fetching book details:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET /api/books/:id/pages/:pageNumber
export const getBookPage = async (req: Request, res: Response) => {
  try {
    const { id, pageNumber } = req.params;
    
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found in DB" });
    }

    if (book.source === "upload") {
      // Return the generated image for the page
      const pagePath = path.join(process.cwd(), 'uploads', 'pages', id as string, `page-${pageNumber}.png`);
      if (fs.existsSync(pagePath)) {
        return res.sendFile(pagePath);
      } else {
        return res.status(404).json({ success: false, message: "Page not found or still processing" });
      }
    }

    // For API or Gutenberg, we might just return text or proxy content here?
    // Gutenberg plain text can be sliced. But a true pageflip works best with images or fixed-size HTML pages.
    res.status(501).json({ success: false, message: "Only uploaded PDF pages are natively served for now. API books handled on frontend." });

  } catch (error) {
    console.error("Error fetching page:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// POST /api/books/upload
export const uploadBook = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No PDF file provided" });
    }

    const { originalname, path: filePath } = req.file;
    const title = req.body.title || originalname.replace('.pdf', '');
    const author = req.body.author || "Unknown";
    
    const book = await Book.create({
      title,
      author,
      source: "upload",
      pdfUrl: filePath,
      totalPages: 0, // Will be updated by worker
    });

    // Add job to PDF processing queue
    await pdfQueue.add("process-pdf", {
      bookId: book._id,
      pdfPath: filePath
    });

    res.status(201).json({ success: true, data: book, message: "Book uploaded and processing started" });
  } catch (error) {
    console.error("Error uploading book:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

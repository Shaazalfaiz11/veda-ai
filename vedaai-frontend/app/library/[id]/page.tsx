"use client"

import React, { useEffect, useState, use } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { API_URL } from "../../lib/api";

const Reader = dynamic(() => import("../../../components/library/Reader"), { ssr: false });

export default function BookReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [book, setBook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/books/${id}`);
        setBook(res.data.data);
      } catch (error) {
        console.error("Failed to fetch book", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) fetchBook();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-gray-500 text-sm font-medium">Loading book...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-700">Book not found.</h2>
      </div>
    );
  }

  return (
    <Reader 
      bookId={book._id} 
      totalPages={book.totalPages === 0 ? 10 : book.totalPages}
      title={book.title}
      author={book.author}
      coverImage={book.coverImage}
      description={book.description}
      source={book.source}
    />
  );
}

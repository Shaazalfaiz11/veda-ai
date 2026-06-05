"use client";

import React, { useState, useEffect } from "react";
import BookCard from "../../components/library/BookCard";
import UploadBookModal from "../../components/library/UploadBookModal";
import { Search, BookOpen, Loader2, Upload, Heart } from "lucide-react";
import axios from "axios";
import { API_URL } from "../lib/api";

function getFavorites(): any[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("vedaai_favorites") || "[]");
  } catch { return []; }
}

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [favorites, setFavorites] = useState<any[]>([]);

  const fetchBooks = async (query = "") => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/books${query ? `?query=${encodeURIComponent(query)}` : ""}`);
      setBooks(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch books", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load favorites from localStorage
  const refreshFavorites = () => {
    setFavorites(getFavorites());
  };

  useEffect(() => {
    fetchBooks();
    refreshFavorites();
  }, []);

  // Refresh favorites when switching to that tab
  useEffect(() => {
    if (activeTab === "favorites") refreshFavorites();
  }, [activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks(searchQuery);
  };

  const displayBooks = activeTab === "favorites" ? favorites : books;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
              <BookOpen className="text-indigo-600" size={32} />
              eBook Library
            </h1>
            <p className="mt-2 text-sm text-gray-500">Discover and read books from your collection and the web.</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <form onSubmit={handleSearch} className="relative group w-full md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search library or Google Books..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm group-hover:shadow-md"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            </form>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all text-sm whitespace-nowrap"
            >
              <Upload size={18} />
              Upload PDF
            </button>
          </div>
        </div>

        {/* Tabs: All / Favorites */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <BookOpen size={16} />
            All Books
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "favorites"
                ? "bg-red-500 text-white shadow-md shadow-red-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Heart size={16} />
            Favorites
            {favorites.length > 0 && (
              <span className={`ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === "favorites" ? "bg-white/20" : "bg-red-100 text-red-600"
              }`}>
                {favorites.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Section */}
        {activeTab === "all" && isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
            <p className="text-gray-500 font-medium text-sm">Loading library...</p>
          </div>
        ) : displayBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {displayBooks.map((book) => (
              <BookCard 
                key={book._id || book.id}
                id={book._id || book.id}
                title={book.title}
                author={book.author}
                coverImage={book.coverImage}
                source={book.source}
                totalPages={book.totalPages}
              />
            ))}
          </div>
        ) : (
          <div className="text-center bg-white rounded-3xl p-12 border border-gray-100 shadow-sm mt-4">
            {activeTab === "favorites" ? (
              <>
                <Heart className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-6">Tap the ❤️ heart on any book to save it here for quick offline access.</p>
                <button
                  onClick={() => setActiveTab("all")}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <BookOpen size={18} />
                  Browse Library
                </button>
              </>
            ) : (
              <>
                <BookOpen className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No books found</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-6">Try adjusting your search query or upload a new book to your collection.</p>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <Upload size={18} />
                  Upload Your First Book
                </button>
              </>
            )}
          </div>
        )}

      </div>

      <UploadBookModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        onSuccess={() => fetchBooks()}
      />
    </div>
  );
}

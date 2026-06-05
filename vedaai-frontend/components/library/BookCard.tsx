"use client"

import React, { useState, useEffect } from "react";
import { Book as BookIcon, Heart } from "lucide-react";
import { useRouter } from "next/navigation";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  source: string;
  totalPages: number;
}

// Helper to get/set favorites from localStorage
function getFavorites(): any[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("vedaai_favorites") || "[]");
  } catch { return []; }
}

function setFavorites(favs: any[]) {
  localStorage.setItem("vedaai_favorites", JSON.stringify(favs));
}

export default function BookCard({ id, title, author, coverImage, source, totalPages }: BookCardProps) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    setIsFav(getFavorites().some((b: any) => b.id === id));
  }, [id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favs = getFavorites();
    if (isFav) {
      setFavorites(favs.filter((b: any) => b.id !== id));
      setIsFav(false);
    } else {
      setFavorites([...favs, { id, title, author, coverImage, source, totalPages }]);
      setIsFav(true);
    }
  };

  return (
    <div 
      onClick={() => router.push(`/library/${id}`)}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow group flex flex-col h-full relative"
    >
      <div className="relative w-full aspect-[2/3] bg-gray-100 rounded-xl overflow-hidden mb-4 flex-shrink-0">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <BookIcon size={48} className="opacity-20" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md text-xs font-medium">
          {source === "upload" ? "PDF" : "API"}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight mb-1 pr-8">{title}</h3>
        <p className="text-sm text-gray-500 line-clamp-1">{author}</p>
        
        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-gray-400 font-medium">
          <span>{totalPages} Pages</span>
        </div>
      </div>

      {/* Favorite heart button */}
      <button
        onClick={toggleFavorite}
        className={`absolute top-6 left-6 p-1.5 rounded-full backdrop-blur-md transition-all z-10 ${
          isFav 
            ? "bg-red-500 text-white shadow-lg shadow-red-200" 
            : "bg-white/80 text-gray-400 hover:text-red-400 hover:bg-white"
        }`}
      >
        <Heart size={16} fill={isFav ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

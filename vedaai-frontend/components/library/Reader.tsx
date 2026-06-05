"use client";

import React, { useRef, useState, useEffect, forwardRef } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen, Maximize2, Minimize2 } from "lucide-react";
import HTMLFlipBook from "react-pageflip";
import { useRouter } from "next/navigation";
import { API_URL } from "../../app/lib/api";

interface ReaderProps {
  bookId: string;
  totalPages: number;
  title: string;
  author?: string;
  coverImage?: string;
  description?: string;
  source?: string;
}

const PAGE_WIDTH = 420;
const PAGE_HEIGHT = 600;

const FlipPage = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  (props, ref) => (
    <div ref={ref} style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, overflow: "hidden" }}>
      {props.children}
    </div>
  )
);
FlipPage.displayName = "FlipPage";

// ─── UPLOADED PDF READER (flipbook with page images) ───
function PdfFlipReader({ bookId, totalPages, title, author }: ReaderProps) {
  const bookRef = useRef<any>(null);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const onPage = (e: any) => setCurrentPage(e.data);
  const nextPage = () => bookRef.current?.pageFlip()?.flipNext();
  const prevPage = () => bookRef.current?.pageFlip()?.flipPrev();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
      if (e.key === "Escape") setIsFullScreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const pages: React.ReactNode[] = [];

  // Cover
  pages.push(
    <FlipPage key="cover">
      <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex flex-col items-center justify-center p-8 text-center">
        <BookOpen size={48} className="text-white/50 mb-4" />
        <h2 className="text-lg font-bold text-white max-w-[280px] line-clamp-3">{title}</h2>
        <p className="text-white/60 text-sm mt-2">{author || "Unknown Author"}</p>
        <p className="text-white/30 text-xs mt-4">{totalPages} pages</p>
      </div>
    </FlipPage>
  );

  // PDF pages
  for (let i = 1; i <= totalPages; i++) {
    pages.push(
      <FlipPage key={`page-${i}`}>
        <div className="w-full h-full bg-white flex items-center justify-center relative">
          <img
            src={`${API_URL}/api/books/${bookId}/pages/${i}`}
            alt={`Page ${i}`}
            className="w-full h-full object-contain"
            loading="lazy"
          />
          <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", fontSize: 11, color: "#9ca3af" }}>
            — {i} —
          </div>
        </div>
      </FlipPage>
    );
  }

  // Back cover
  pages.push(
    <FlipPage key="back">
      <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex flex-col items-center justify-center text-center gap-3">
        <BookOpen size={48} className="text-white/40" />
        <p className="text-white/50 text-sm font-medium">End of Book</p>
      </div>
    </FlipPage>
  );

  return (
    <div className={`${isFullScreen ? "fixed inset-0 z-50" : "min-h-screen"} bg-gradient-to-b from-[#2d2d3f] to-[#1a1a2e] flex flex-col items-center`}>
      <div className="w-full bg-black/30 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => isFullScreen ? setIsFullScreen(false) : router.push("/library")} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span className="font-medium text-sm hidden sm:inline">{isFullScreen ? "Exit" : "Library"}</span>
        </button>
        <div className="text-center flex-1 mx-4">
          <h1 className="text-sm font-bold text-white/90 line-clamp-1">{title}</h1>
        </div>
        <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 text-white/60 hover:text-white">
          {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto flex items-center justify-center py-6 px-4 relative">
        <button onClick={prevPage} className="absolute left-1 md:left-6 z-10 p-2.5 bg-white/10 rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-all">
          <ChevronLeft size={22} />
        </button>

        <div className="shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10">
          {/* @ts-ignore */}
          <HTMLFlipBook width={PAGE_WIDTH} height={PAGE_HEIGHT} size="fixed" minWidth={280} maxWidth={480} minHeight={380} maxHeight={660}
            maxShadowOpacity={0.5} showCover={true} mobileScrollSupport={true} onFlip={onPage} className="flip-book" ref={bookRef}
            style={{}} startPage={0} drawShadow={true} flippingTime={700} usePortrait={true} startZIndex={0} autoSize={true}
            clickEventForward={true} useMouseEvents={true} swipeDistance={30} showPageCorners={true} disableFlipByClick={false}>
            {pages}
          </HTMLFlipBook>
        </div>

        <button onClick={nextPage} className="absolute right-1 md:right-6 z-10 p-2.5 bg-white/10 rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-all">
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="fixed bottom-4 bg-black/60 backdrop-blur-md text-white px-5 py-2 rounded-full text-xs font-medium shadow-xl">
        Page {currentPage + 1} of {pages.length}
      </div>
    </div>
  );
}

// ─── API BOOK READER (Google Books embedded full viewer) ───
function GoogleBooksReader({ bookId, title, author }: ReaderProps) {
  const router = useRouter();
  const [isFullScreen, setIsFullScreen] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullScreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={`${isFullScreen ? "fixed inset-0 z-50" : "min-h-screen"} bg-[#1a1a2e] flex flex-col`}>
      {/* App-like dark header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-md border-b border-white/10 z-10">
        <button onClick={() => router.push("/library")} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium hidden sm:inline">Library</span>
        </button>
        <div className="text-center flex-1 mx-4">
          <h1 className="text-sm font-bold text-white/90 line-clamp-1">{title}</h1>
          {author && <p className="text-[10px] text-white/40">{author}</p>}
        </div>
        <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 text-white/60 hover:text-white">
          {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* Full-page Google Books embedded reader — shows all available pages for free */}
      <div className="flex-1 w-full relative bg-[#525659]">
        <iframe
          src={`https://books.google.com/books?id=${bookId}&lpg=PP1&pg=PP1&output=embed`}
          className="w-full h-full border-0"
          allowFullScreen
          title={`${title} - Full Book Reader`}
          style={{ minHeight: "calc(100vh - 52px)" }}
        />
      </div>
    </div>
  );
}

// ─── MAIN READER COMPONENT ───
export default function Reader(props: ReaderProps) {
  if (props.source === "api") {
    return <GoogleBooksReader {...props} />;
  }
  return <PdfFlipReader {...props} />;
}

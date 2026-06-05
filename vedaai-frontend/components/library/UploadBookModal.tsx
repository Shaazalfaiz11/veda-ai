"use client"

import React, { useState } from "react";
import { X, Upload, FileType, Loader2 } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../app/lib/api";

interface UploadBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadBookModal({ isOpen, onClose, onSuccess }: UploadBookModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      if (title) formData.append("title", title);
      if (author) formData.append("author", author);

      // Using the assumed local dev proxy or direct URL if known. Adjust if needed.
      await axios.post(`${API_URL}/api/books/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Upload PDF Book</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Book File</label>
            <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 hover:border-blue-400 transition-colors flex flex-col items-center justify-center text-center cursor-pointer">
              <input 
                type="file" 
                accept="application/pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
              {file ? (
                <>
                  <FileType className="text-blue-500 mb-3" size={32} />
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <Upload className="text-gray-400 mb-3" size={32} />
                  <p className="text-sm font-medium text-gray-900">Click or drag PDF here</p>
                  <p className="text-xs text-gray-500 mt-1">Maximum file size 100MB</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Title <span className="text-gray-400 text-xs">(Optional)</span></label>
            <input 
              type="text" 
              placeholder="Leave blank to use filename"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Author <span className="text-gray-400 text-xs">(Optional)</span></label>
            <input 
              type="text" 
              placeholder="Author name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={!file || isUploading}
            className="w-full bg-gradient-to-r from-[#6E42E5] to-[#8C64F7] text-white rounded-xl py-3.5 font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            {isUploading ? "Uploading & Processing..." : "Upload Book"}
          </button>
        </form>
      </div>
    </div>
  );
}

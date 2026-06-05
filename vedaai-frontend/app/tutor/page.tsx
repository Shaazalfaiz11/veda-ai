"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, ArrowLeft, Sparkles, Send } from "lucide-react";
import Link from "next/link";
import { API_URL } from "../lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [textInput, setTextInput] = useState("");
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentTranscript, isThinking]);

  // Speak text using Edge Neural TTS backend — natural human female voice
  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled) return;
    
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    try {
      setIsSpeaking(true);
      const response = await fetch(`${API_URL}/api/tutor/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) throw new Error("TTS failed");
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.playbackRate = 1.3;
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => setIsSpeaking(false);
      
      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);

  // Send message to tutor API with SSE streaming
  // Optimized: starts speaking the first sentence while rest streams in
  const sendToTutor = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;
    
    const newUserMsg: Message = { role: "user", content: userMessage.trim() };
    setMessages(prev => [...prev, newUserMsg]);
    setIsThinking(true);
    setCurrentTranscript("");

    try {
      const response = await fetch(`${API_URL}/api/tutor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-10),
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let firstSentenceSpoken = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              if (data.token) {
                fullText += data.token;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return [...prev.slice(0, -1), { role: "assistant", content: fullText }];
                  }
                  return [...prev, { role: "assistant", content: fullText }];
                });

                // Speak the first sentence as soon as it's ready
                if (!firstSentenceSpoken && /[.!?]\s/.test(fullText)) {
                  firstSentenceSpoken = true;
                  setIsThinking(false);
                }
              }
              if (data.done) {
                setIsThinking(false);
                // Always speak the FULL response when done
                speak(data.fullResponse || fullText);
              }
              if (data.error) {
                setIsThinking(false);
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error("Tutor API error:", error);
      setIsThinking(false);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again!" }]);
    }
  }, [messages, speak]);

  // Start speech recognition
  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Your browser doesn't support speech recognition. Please use Chrome.");
      return;
    }

    // Cancel any ongoing audio
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(false);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      setCurrentTranscript(interim || final);
      if (final) {
        setCurrentTranscript("");
        sendToTutor(final);
        recognition.stop();
        setIsListening(false);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setCurrentTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [sendToTutor]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    if (currentTranscript) {
      sendToTutor(currentTranscript);
      setCurrentTranscript("");
    }
  }, [currentTranscript, sendToTutor]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendToTutor(textInput);
      setTextInput("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/assignments" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft size={20} />
          <span className="font-medium hidden sm:inline">Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-500" size={20} />
          <h1 className="text-lg font-bold text-gray-900">English Tutor</h1>
        </div>
        <button
          onClick={() => {
            setVoiceEnabled(!voiceEnabled);
            if (voiceEnabled && audioRef.current) { audioRef.current.pause(); audioRef.current = null; setIsSpeaking(false); }
          }}
          className={`p-2 rounded-full transition-colors ${voiceEnabled ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}
        >
          {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        {messages.length === 0 && !isListening && (
          <div className="text-center mt-16">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
              <Sparkles size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Hi! I&apos;m your English Tutor 👋</h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              Click the microphone and start speaking in English. I&apos;ll help you practice and improve!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Tell me about yourself", "Help me with grammar", "Let's practice vocabulary", "Can we have a conversation?"].map((s) => (
                <button
                  key={s}
                  onClick={() => sendToTutor(s)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-md"
                  : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isThinking && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {currentTranscript && (
          <div className="flex justify-end mb-4">
            <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md bg-indigo-400/20 text-indigo-800 text-sm italic border border-indigo-200">
              {currentTranscript}...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Controls */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {/* Text Input */}
          <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </form>

          {/* Mic Button */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isThinking}
            className={`relative p-4 rounded-full transition-all shadow-lg ${
              isListening
                ? "bg-red-500 text-white shadow-red-200 scale-110"
                : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-200 hover:scale-105"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                <span className="absolute -inset-1 rounded-full border-2 border-red-300 animate-pulse" />
              </>
            )}
            {isSpeaking && (
              <span className="absolute -inset-1 rounded-full border-2 border-indigo-300 animate-pulse" />
            )}
          </button>
        </div>

        {/* Status Indicator */}
        <div className="text-center mt-2">
          <p className="text-xs text-gray-400 font-medium">
            {isListening ? "🎙️ Listening... Speak now!" : isSpeaking ? "🔊 Tutor is speaking..." : isThinking ? "💭 Thinking..." : "Tap the mic or type to start"}
          </p>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { FocusMode } from "../types";
import { Search, Sparkles, Send, Globe, BookOpen, PenTool, Code, Newspaper, Mic, MicOff } from "lucide-react";
import { motion } from "motion/react";
import ThreeAvatar from "./ThreeAvatar";

interface WelcomeScreenProps {
  focusMode: FocusMode;
  onFocusChange: (value: FocusMode) => void;
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isSpeaking: boolean;
}

const suggestionsByMode: Record<FocusMode, string[]> = {
  all: [
    "Compare the cost and efficiency of wind vs solar energy",
    "What are the primary factors causing inflation and how is it curbed?",
    "Explain the history and influence of the Bauhaus design school",
  ],
  academic: [
    "Explain quantum entanglement theory and its experimental proofs",
    "Summarize the major hypotheses for the origin of water on Earth",
    "Explain CRISPR-Cas9 mechanism and its current clinical state",
  ],
  news: [
    "What are the latest global semiconductor supply chain reports?",
    "Summarize major reports regarding renewable energy grid integrations",
    "Detail the primary international tech policies passed this week",
  ],
  writing: [
    "Draft an atmospheric opening scene for a neo-noir detective thriller",
    "Write a persuasive proposal for a 3D art exhibition",
    "Compose an elegant poem celebrating human curiosity and technology",
  ],
  coding: [
    "Write a highly performant React custom hook for debouncing inputs",
    "Create a clean TypeScript solution for checking graph dependency loops",
    "Explain tail-call optimization in TypeScript with solid examples",
  ],
};

export default function WelcomeScreen({
  focusMode,
  onFocusChange,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  isSpeaking,
}: WelcomeScreenProps) {
  const suggestions = suggestionsByMode[focusMode];

  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onInputChange(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSuggestionClick = (text: string) => {
    onInputChange(text);
  };

  const getFocusBadge = (mode: FocusMode) => {
    switch (mode) {
      case "all":
        return { label: "Web Search", icon: Globe, color: "text-blue-400", bg: "bg-blue-400/5" };
      case "academic":
        return { label: "Academic", icon: BookOpen, color: "text-indigo-400", bg: "bg-indigo-400/5" };
      case "news":
        return { label: "News & Events", icon: Newspaper, color: "text-amber-400", bg: "bg-amber-400/5" };
      case "writing":
        return { label: "Creative Writing", icon: PenTool, color: "text-rose-400", bg: "bg-rose-400/5" };
      case "coding":
        return { label: "Code Crafting", icon: Code, color: "text-emerald-400", bg: "bg-emerald-400/5" };
    }
  };

  const badge = getFocusBadge(focusMode);
  const BadgeIcon = badge.icon;

  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto px-4 py-16 text-center h-full min-h-[60vh] justify-self-center select-none" id="welcome-stage">
      {/* 3D Interactive AI Assistant Companion */}
      <div className="mb-6 flex justify-center animate-fadeIn relative z-20">
        <ThreeAvatar isLoading={isLoading} isSpeaking={isSpeaking} size={150} />
      </div>

      {/* Title */}
      <div className="mb-10 relative">
        <div className="absolute top-[-28px] left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-blue-400 uppercase tracking-widest shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>Sophia Intelligent Grounding</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-sans font-semibold text-white tracking-tight leading-tight">
          Where <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-teal-400 bg-clip-text text-transparent">knowledge</span> begins.
        </h1>
        <p className="text-white/40 text-sm mt-3 max-w-md mx-auto leading-relaxed">
          Ask Sophia anything. Get instant search-grounded insights, curated web citations, and expert structured synthesis.
        </p>
      </div>

      {/* Focus Mode Selection Grid */}
      <div className="w-full mb-8 max-w-xl bg-[#141414]/80 border border-white/5 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl">
        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3 font-semibold text-left pl-1">
          Select Search Focus
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(["all", "academic", "news", "writing", "coding"] as FocusMode[]).map((mode) => {
            const opt = getFocusBadge(mode);
            const OptIcon = opt.icon;
            const isSelected = focusMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onFocusChange(mode)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                  isSelected
                    ? "bg-white/5 text-white border-blue-500/30 shadow-md"
                    : "bg-transparent text-white/40 border-transparent hover:bg-white/2 hover:text-white/70"
                }`}
              >
                <OptIcon className={`w-4 h-4 ${isSelected ? opt.color : "text-white/20"}`} />
                <span className="truncate w-full text-[11px]">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Input Form */}
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl bg-[#141414] border border-white/10 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex flex-col focus-within:border-white/20 transition-all focus-within:shadow-blue-500/5 group"
      >
        <div className="flex items-center gap-3 px-2 py-1">
          <Search className="w-4.5 h-4.5 text-white/30 group-focus-within:text-blue-400 transition-colors shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={isListening ? "Listening closely... Speak now!" : `Ask anything in ${badge.label}...`}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none text-white placeholder-white/20 text-sm focus:outline-none focus:ring-0 disabled:opacity-50 font-medium"
          />
          {/* Microphone trigger */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            className={`p-1.5 rounded-full transition-all shrink-0 cursor-pointer ${
              isListening
                ? "bg-red-500/25 text-red-400 ring-2 ring-red-500/30 animate-pulse"
                : "text-white/30 hover:text-blue-400 hover:bg-white/5"
            }`}
            title={isListening ? "Stop listening" : "Ask by voice"}
          >
            {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
          </button>
        </div>

        <div className="flex items-center justify-between px-2 pt-2.5 mt-2.5 border-t border-white/5">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${badge.bg} text-[10px] font-bold ${badge.color} border border-white/5`}>
            <BadgeIcon className="w-3.5 h-3.5" />
            <span>{badge.label}</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-8 h-8 rounded-full bg-white/10 text-white/40 flex items-center justify-center hover:bg-blue-600 hover:text-white disabled:bg-white/5 disabled:text-white/20 transition-all cursor-pointer shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Sugesstions / Prompts Grid */}
      <div className="w-full max-w-xl mt-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-white/50 cursor-pointer hover:bg-white/10 hover:text-white transition-all text-left max-w-[280px] sm:max-w-[340px] truncate"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

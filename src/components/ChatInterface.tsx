import React, { useRef, useEffect } from "react";
import { Message, FocusMode, Source } from "../types";
import { Search, Send, Globe, BookOpen, PenTool, Code, Newspaper, Copy, Check, ExternalLink, RefreshCw, Sparkles, AlertCircle, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import ThreeAvatar from "./ThreeAvatar";
const avatarUrl = "/src/assets/avatar.jpg";

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  focusMode: FocusMode;
  onFocusChange: (value: FocusMode) => void;
  searchSteps: string[];
  onFollowUpClick: (question: string) => void;
  isSpeaking: boolean;
  currentSpeakingMessageId: string | null;
  onSpeak: (text: string, id?: string) => void;
  onStopSpeaking: () => void;
}

// Simple and highly robust Custom Markdown formatter to render responses elegantly
function CustomMarkdown({ text }: { text: string }) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  if (!text) return null;

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split content into blocks: paragraph, headings, lists, code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4 text-white/80 text-sm leading-relaxed text-left">
      {parts.map((part, idx) => {
        // Render Code Block
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "code";
          const code = match ? match[2].trim() : part.slice(3, -3).trim();

          return (
            <div key={idx} className="my-4 overflow-hidden rounded-xl border border-white/5 bg-slate-950 font-mono text-xs shadow-lg">
              <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-wider text-white/50 font-bold">
                <span>{lang || "code"}</span>
                <button
                  onClick={() => copyToClipboard(code, idx)}
                  className="flex items-center gap-1 hover:text-white cursor-pointer"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto whitespace-pre scrollbar-thin text-white/95">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Render standard line configurations (headings, lists, paragraph)
        const lines = part.split("\n");
        return (
          <div key={idx} className="space-y-2">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              // Empty lines
              if (!trimmed) return <div key={lIdx} className="h-2" />;

              // Headings (###)
              if (trimmed.startsWith("###")) {
                return (
                  <h3 key={lIdx} className="text-base font-semibold text-white tracking-tight pt-3 pb-1 border-b border-white/5">
                    {trimmed.replace(/^###\s*/, "")}
                  </h3>
                );
              }

              // Headings (##)
              if (trimmed.startsWith("##")) {
                return (
                  <h2 key={lIdx} className="text-lg font-semibold text-white tracking-tight pt-4 pb-1">
                    {trimmed.replace(/^##\s*/, "")}
                  </h2>
                );
              }

              // Headings (#)
              if (trimmed.startsWith("#")) {
                return (
                  <h1 key={lIdx} className="text-xl font-bold text-white tracking-tight pt-4 pb-1">
                    {trimmed.replace(/^#\s*/, "")}
                  </h1>
                );
              }

              // Bullet points (-)
              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                const formatted = trimmed.replace(/^[-*]\s*/, "");
                return (
                  <ul key={lIdx} className="list-disc pl-5 space-y-1">
                    <li>{renderInlineStyles(formatted)}</li>
                  </ul>
                );
              }

              // Numbered lists
              const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
              if (numMatch) {
                return (
                  <ol key={lIdx} className="list-decimal pl-5 space-y-1" start={parseInt(numMatch[1])}>
                    <li>{renderInlineStyles(numMatch[2])}</li>
                  </ol>
                );
              }

              // Normal text Paragraph
              return <p key={lIdx}>{renderInlineStyles(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

// Convert markdown inline bold **text** to HTML tags
function renderInlineStyles(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function ChatInterface({
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  focusMode,
  onFocusChange,
  searchSteps,
  onFollowUpClick,
  isSpeaking,
  currentSpeakingMessageId,
  onSpeak,
  onStopSpeaking,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, searchSteps, isLoading]);

  const getFocusBadge = (mode: FocusMode) => {
    switch (mode) {
      case "all":
        return { label: "Web Search", icon: Globe, color: "text-blue-400" };
      case "academic":
        return { label: "Academic Research", icon: BookOpen, color: "text-purple-400" };
      case "news":
        return { label: "News Focus", icon: Newspaper, color: "text-amber-400" };
      case "writing":
        return { label: "Creative Writing", icon: PenTool, color: "text-rose-400" };
      case "coding":
        return { label: "Code Crafting", icon: Code, color: "text-emerald-400" };
    }
  };

  const badge = getFocusBadge(focusMode);
  const BadgeIcon = badge.icon;

  const extractDomain = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace("www.", "");
    } catch {
      return "Web Page";
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden" id="chat-workspace">
      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin space-y-8 select-text">
        <div className="max-w-3xl mx-auto space-y-10">
          {messages.map((message) => (
            <div key={message.id} className="space-y-4 animate-fadeIn">
              {/* User Message */}
              {message.role === "user" && (
                <div className="flex justify-end">
                  <div className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-2xl max-w-[85%] text-left text-sm shadow-xl">
                    {message.content}
                  </div>
                </div>
              )}

              {/* Assistant Message */}
              {message.role === "assistant" && (
                <div className="space-y-4 text-left">
                  {/* Assistant Header and Avatar */}
                  <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                    <div className="relative">
                      <img
                        src={avatarUrl}
                        alt="Sophia Avatar"
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-white/10 ring-2 ring-blue-500/10"
                      />
                      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-slate-950 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Sophia</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold uppercase tracking-wider">
                          Companion
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40">Research Grounded AI Expert</span>
                    </div>

                    {/* Speaker buttons and wave visualizer */}
                    <div className="ml-auto flex items-center gap-2">
                      {isSpeaking && currentSpeakingMessageId === message.id && (
                        <div className="flex items-end gap-0.5 h-3.5 px-1 bg-white/5 border border-white/5 rounded-md">
                          <span className="w-0.5 bg-blue-400 rounded-full animate-[pulse_0.8s_infinite] h-full" style={{ animationDelay: '0ms' }} />
                          <span className="w-0.5 bg-indigo-400 rounded-full animate-[pulse_0.8s_infinite] h-2/3" style={{ animationDelay: '150ms' }} />
                          <span className="w-0.5 bg-teal-400 rounded-full animate-[pulse_0.8s_infinite] h-5/6" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (isSpeaking && currentSpeakingMessageId === message.id) {
                            onStopSpeaking();
                          } else {
                            onSpeak(message.content, message.id);
                          }
                        }}
                        className={`p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1 border border-transparent ${
                          isSpeaking && currentSpeakingMessageId === message.id ? "text-blue-400 bg-blue-500/5 border-blue-500/15" : ""
                        }`}
                        title={isSpeaking && currentSpeakingMessageId === message.id ? "Mute Sophia" : "Speak response"}
                      >
                        {isSpeaking && currentSpeakingMessageId === message.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[9px] font-bold tracking-wide uppercase">
                          {isSpeaking && currentSpeakingMessageId === message.id ? "Mute" : "Speak"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Sources Block */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-white/40 font-semibold pl-1">
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        <span>Verified Web Sources ({message.sources.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2 py-1 max-h-[140px] overflow-y-auto scrollbar-thin">
                        {message.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-xs text-white/70 hover:text-blue-400 transition-all max-w-[220px] truncate"
                          >
                            <span className="w-4 h-4 rounded bg-[#050505] flex items-center justify-center font-bold text-[9px] text-white/40 border border-white/10 shrink-0">
                              {sIdx + 1}
                            </span>
                            <div className="flex flex-col text-left truncate">
                              <span className="font-semibold text-white/95 truncate leading-tight">
                                {src.title || "Information Source"}
                              </span>
                              <span className="text-[9px] text-white/30 truncate leading-none mt-0.5">
                                {extractDomain(src.url)}
                              </span>
                            </div>
                            <ExternalLink className="w-2.5 h-2.5 text-white/30 shrink-0 ml-1" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Core markdown response text */}
                  <div className="bg-[#141414]/90 border border-white/10 backdrop-blur-xl rounded-2xl p-5 shadow-2xl">
                    <CustomMarkdown text={message.content} />
                  </div>

                  {/* Interactive Follow up recommendation questions */}
                  {message.followUps && message.followUps.length > 0 && !message.isStreaming && (
                    <div className="space-y-2.5 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs text-white/40 font-semibold pl-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>Recommended Follow-ups</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {message.followUps.slice(0, 3).map((q, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => onFollowUpClick(q)}
                            className="text-left text-xs text-white/70 hover:text-white bg-white/5 border border-white/5 hover:border-white/10 px-4 py-2.5 rounded-xl transition-all cursor-pointer hover:bg-white/10 flex items-center justify-between group"
                          >
                            <span>{q}</span>
                            <Send className="w-3 h-3 text-white/30 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Active Search & Grounding Progress Loading State */}
          {isLoading && (
            <div className="space-y-4 animate-pulse text-left">
              <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                <div className="relative flex-shrink-0">
                  <ThreeAvatar isLoading={true} size={48} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white">Sophia</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
                    <span className="text-[10px] text-blue-400 font-semibold">Sophia is researching...</span>
                  </div>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2.5">
                {searchSteps.map((step, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-2.5 text-xs text-white/70">
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500/15 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                      ✓
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2.5 text-xs text-white/40">
                  <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
                  <span>Synthesizing and structuring the answers...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Query Form Section */}
      <div className="p-4 bg-slate-950/80 border-t border-white/5 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={onSubmit}
            className="w-full bg-[#141414] border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col focus-within:border-white/20 transition-all focus-within:shadow-blue-500/5 group"
          >
            <div className="flex items-center gap-3 px-2 py-1">
              <Search className="w-4.5 h-4.5 text-white/30 group-focus-within:text-blue-400 transition-colors shrink-0" />
              <input
                type="text"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={isListening ? "Listening closely... Speak now!" : `Ask follow-up in ${badge.label}...`}
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
              {/* Focus mode mini indicators */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const modes: FocusMode[] = ["all", "academic", "news", "writing", "coding"];
                    const nextIdx = (modes.indexOf(focusMode) + 1) % modes.length;
                    onFocusChange(modes[nextIdx]);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[9px] font-bold text-white/60 border border-white/10 cursor-pointer"
                >
                  <BadgeIcon className={`w-3.5 h-3.5 ${badge.color}`} />
                  <span>{badge.label}</span>
                </button>
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
          <div className="text-[9px] text-white/20 text-center mt-2.5 font-mono tracking-wider">
            Sophia is grounded using live Google Search index results where applicable.
          </div>
        </div>
      </div>
    </div>
  );
}

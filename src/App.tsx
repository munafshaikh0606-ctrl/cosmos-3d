import React, { useState, useEffect } from "react";
import { ChatSession, Message, FocusMode } from "./types";
import ThreeBackground from "./components/ThreeBackground";
import Sidebar from "./components/Sidebar";
import WelcomeScreen from "./components/WelcomeScreen";
import ChatInterface from "./components/ChatInterface";
import { Sparkles, AlertCircle } from "lucide-react";

export default function App() {
  // Application states
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<FocusMode>("all");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchSteps, setSearchSteps] = useState<string[]>([]);
  const [pulseTrigger, setPulseTrigger] = useState(0);
  const [bg3DEnabled, setBg3DEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem("sophia_voice_mode") !== "false");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingMessageId, setCurrentSpeakingMessageId] = useState<string | null>(null);

  const activeUtterancesRef = React.useRef<SpeechSynthesisUtterance[]>([]);
  const speechSessionRef = React.useRef<number>(0);

  // Toggle voice settings
  const handleToggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    localStorage.setItem("sophia_voice_mode", String(nextVal));
    if (!nextVal) {
      stopSpeaking();
    }
  };

  const stopSpeaking = () => {
    speechSessionRef.current += 1; // Invalidate any currently active speech sessions
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    activeUtterancesRef.current = [];
    setIsSpeaking(false);
    setCurrentSpeakingMessageId(null);
  };

  const speak = (text: string, messageId?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    stopSpeaking(); // clear any previous speech and increment session

    if (!text) return;

    // Clean up markdown text for smooth TTS reading
    let cleanText = text
      .replace(/```[\s\S]*?```/g, "") // omit code blocks
      .replace(/###\s*(.*)/g, "$1.")
      .replace(/##\s*(.*)/g, "$1.")
      .replace(/#\s*(.*)/g, "$1.")
      .replace(/\*\*(.*?)\*\*/g, "$1") // strip bold markers
      .replace(/[-*]\s+/g, "") // strip bullets
      .replace(/\[\d+\]/g, "") // strip citation markers [1], [2], etc.
      .replace(/https?:\/\/[^\s]+/g, "") // strip URLs
      .trim();

    if (!cleanText) return;

    // Split text into manageable natural clauses/sentences to prevent browser TTS limit cut-offs
    const sentences = cleanText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length === 0) return;

    const currentSession = speechSessionRef.current;
    setCurrentSpeakingMessageId(messageId || null);
    setIsSpeaking(true);

    let index = 0;

    const playNext = () => {
      if (currentSession !== speechSessionRef.current) {
        return; // This speech session was cancelled/overridden
      }

      if (index >= sentences.length) {
        setIsSpeaking(false);
        setCurrentSpeakingMessageId(null);
        return;
      }

      const sentenceText = sentences[index];
      const utterance = new SpeechSynthesisUtterance(sentenceText);
      
      // Grab Sophia's warm, high quality female speech voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = ["Google US English", "Microsoft Zira", "Samantha", "Karen", "Moira", "Tessa", "Fiona", "en-US", "en-GB"];
      let selectedVoice = null;
      for (const name of preferred) {
        selectedVoice = voices.find((v) => v.name.includes(name) || v.lang.startsWith(name));
        if (selectedVoice) break;
      }
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = 1.05; // slightly conversational rate
      utterance.pitch = 1.05; // warm friendly pitch

      utterance.onend = () => {
        if (currentSession !== speechSessionRef.current) return;
        index++;
        playNext();
      };

      utterance.onerror = (e) => {
        if (e.error !== "interrupted") {
          console.error("SpeechSynthesis error:", e);
        }
        if (currentSession !== speechSessionRef.current) return;
        index++;
        playNext();
      };

      activeUtterancesRef.current.push(utterance);
      window.speechSynthesis.speak(utterance);
    };

    playNext();
  };

  // Stop speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Load chat sessions from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("perplexity_sessions");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse saved chat history:", err);
      }
    }
  }, []);

  // Save sessions to local storage whenever they change
  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    localStorage.setItem("perplexity_sessions", JSON.stringify(updated));
  };

  // Locate the active session details
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Start a fresh, clean chat thread
  const handleNewChat = () => {
    stopSpeaking();
    setActiveSessionId(null);
    setInput("");
    setSearchSteps([]);
  };

  // Switch between existing chat sessions
  const handleSelectSession = (id: string) => {
    stopSpeaking();
    setActiveSessionId(id);
    const session = sessions.find((s) => s.id === id);
    if (session && session.messages.length > 0) {
      // Restore the focus mode of the last message in that session if available
      const lastMsg = session.messages[session.messages.length - 1];
      if (lastMsg.focusMode) {
        setFocusMode(lastMsg.focusMode);
      }
    }
  };

  // Delete a chat session
  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      handleNewChat();
    }
  };

  // Handle submitting search queries
  const handleQuerySubmit = async (e?: React.FormEvent, questionText?: string) => {
    if (e) e.preventDefault();

    const query = (questionText || input).trim();
    if (!query || isLoading) return;

    stopSpeaking(); // Stop Sophia speaking immediately when a new query is submitted
    setIsLoading(true);
    setInput("");
    setPulseTrigger((prev) => prev + 1); // release shockwave in Three.js background!

    // Setup active session context
    let currentSessionId = activeSessionId;
    let updatedSessions = [...sessions];

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
      focusMode: focusMode,
    };

    if (!currentSessionId) {
      // Create a brand new session
      currentSessionId = crypto.randomUUID();
      const newSession: ChatSession = {
        id: currentSessionId,
        title: query.length > 30 ? query.slice(0, 30) + "..." : query,
        messages: [newUserMessage],
        createdAt: new Date().toISOString(),
      };
      updatedSessions = [newSession, ...updatedSessions];
      setActiveSessionId(currentSessionId);
    } else {
      // Append message to existing session
      updatedSessions = updatedSessions.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, newUserMessage],
          };
        }
        return s;
      });
    }

    saveSessions(updatedSessions);

    // Timeline steps based on focus mode to make research progress immersive and premium
    setSearchSteps(["Initiated query routing"]);
    
    const stepDelays = [
      { step: "Analyzing query search intent...", delay: 600 },
      { step: focusMode === "writing" || focusMode === "coding" 
        ? "Formulating context-specific model instructions..." 
        : `Scanning live web index for keywords related to: "${query.slice(0, 20)}..."`, delay: 1400 },
      { step: focusMode === "writing" || focusMode === "coding"
        ? "Constructing structural outlines..."
        : "Extracting and evaluating citations from web sources...", delay: 2400 }
    ];

    stepDelays.forEach(({ step, delay }) => {
      setTimeout(() => {
        setSearchSteps((prev) => [...prev, step]);
      }, delay);
    });

    try {
      // Compile message history to send to server
      const currentSess = updatedSessions.find((s) => s.id === currentSessionId);
      const messageHistory = currentSess 
        ? currentSess.messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }))
        : [];

      // API request to backend Express server
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: messageHistory,
          focusMode: focusMode,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to compile AI research response.");
      }

      const data = await response.json();

      // Append assistant response message to session
      const newAssistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        followUps: data.followUps,
        timestamp: new Date().toISOString(),
        focusMode: focusMode,
      };

      const finalSessions = updatedSessions.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, newAssistantMessage],
          };
        }
        return s;
      });

      saveSessions(finalSessions);

      // Speak response if voice assistant is active
      if (voiceEnabled) {
        speak(data.answer, newAssistantMessage.id);
      }
    } catch (error: any) {
      console.error("Research Dispatch Error:", error);
      
      // Inject error helper warning into the thread gracefully
      const newErrorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `### ⚠️ Research Interrupted\n\nI was unable to complete this query successfully.\n\n**Reason:** ${error.message || "An unexpected network or configuration error occurred."}\n\n*Please verify your Gemini API key inside the Secrets panel, verify connection states, or try repeating your search request shortly.*`,
        timestamp: new Date().toISOString(),
        focusMode: focusMode,
      };

      const finalSessions = updatedSessions.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, newErrorMessage],
          };
        }
        return s;
      });

      saveSessions(finalSessions);
    } finally {
      setIsLoading(false);
      setSearchSteps([]);
    }
  };

  // Triggered when a follow-up action pill is clicked
  const handleFollowUpClick = (question: string) => {
    handleQuerySubmit(undefined, question);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex bg-slate-950 font-sans text-white antialiased selection:bg-blue-500/20 selection:text-white">
      {/* Three.js Interactive 3D constellation web background */}
      {bg3DEnabled && <ThreeBackground pulseTrigger={pulseTrigger} />}

      {/* Main Container Layout */}
      <div className="flex w-full h-full relative z-10 bg-[#050505]/40">
        {/* Navigation Sidebar */}
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          bg3DEnabled={bg3DEnabled}
          onToggleBg3D={() => setBg3DEnabled(!bg3DEnabled)}
          voiceEnabled={voiceEnabled}
          onToggleVoice={handleToggleVoice}
        />

        {/* Content Panel Area */}
        <main className="flex-1 h-full overflow-hidden flex flex-col relative" id="main-content-canvas">
          {/* Subtle Top Header bar */}
          <header className="h-14 border-b border-white/5 bg-slate-950/20 backdrop-blur-sm px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-xs font-semibold text-white/40 font-mono tracking-wider uppercase">
                Sophia Research Workspace
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                Engine Online
              </span>
            </div>
          </header>

          <div className="flex-1 overflow-hidden">
            {activeSession ? (
              <ChatInterface
                messages={activeSession.messages}
                input={input}
                onInputChange={setInput}
                onSubmit={handleQuerySubmit}
                isLoading={isLoading}
                focusMode={focusMode}
                onFocusChange={setFocusMode}
                searchSteps={searchSteps}
                onFollowUpClick={handleFollowUpClick}
                isSpeaking={isSpeaking}
                currentSpeakingMessageId={currentSpeakingMessageId}
                onSpeak={speak}
                onStopSpeaking={stopSpeaking}
              />
            ) : (
              <WelcomeScreen
                focusMode={focusMode}
                onFocusChange={setFocusMode}
                input={input}
                onInputChange={setInput}
                onSubmit={handleQuerySubmit}
                isLoading={isLoading}
                isSpeaking={isSpeaking}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

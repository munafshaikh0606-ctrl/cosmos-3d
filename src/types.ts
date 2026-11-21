export type FocusMode = "all" | "academic" | "writing" | "coding" | "news";

export interface Source {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  followUps?: string[];
  timestamp: string;
  focusMode?: FocusMode;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

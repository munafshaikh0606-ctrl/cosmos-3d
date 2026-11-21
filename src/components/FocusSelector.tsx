import { FocusMode } from "../types";
import { Globe, BookOpen, PenTool, Code, Newspaper } from "lucide-react";

interface FocusSelectorProps {
  value: FocusMode;
  onChange: (value: FocusMode) => void;
}

const focusOptions: { value: FocusMode; label: string; icon: any; description: string }[] = [
  {
    value: "all",
    label: "All",
    icon: Globe,
    description: "Search the entire web for comprehensive answers",
  },
  {
    value: "academic",
    label: "Academic",
    icon: BookOpen,
    description: "Search scholarly journals, academic publications and scientific papers",
  },
  {
    value: "news",
    label: "News",
    icon: Newspaper,
    description: "Search recent current events, breaking news, and up-to-date reports",
  },
  {
    value: "writing",
    label: "Writing",
    icon: PenTool,
    description: "Focus on rich copycraft, vocabulary, formatting, and creative writing",
  },
  {
    value: "coding",
    label: "Coding",
    icon: Code,
    description: "Focus on clean code blocks, production architecture, and debugging",
  },
];

export default function FocusSelector({ value, onChange }: FocusSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center py-2" id="focus-mode-selector">
      {focusOptions.map((opt) => {
        const Icon = opt.icon;
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.description}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              isSelected
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-500/10"
                : "bg-slate-900/40 text-slate-400 border border-slate-800/40 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-sky-400" : "text-slate-400"}`} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

import { useState } from "react";
import { ChatSession } from "../types";
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, Settings, Info, ToggleLeft, ToggleRight } from "lucide-react";
const avatarUrl = "/src/assets/avatar.jpg";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  bg3DEnabled: boolean;
  onToggleBg3D: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  bg3DEnabled,
  onToggleBg3D,
  voiceEnabled,
  onToggleVoice,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <aside
      id="sidebar-panel"
      className={`relative h-full border-r border-white/5 bg-slate-950 flex flex-col justify-between transition-all duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
        {/* Header Logo */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 mb-6">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/15">
                <div className="w-3.5 h-3.5 bg-white rounded-sm"></div>
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Cosmos <span className="text-blue-500 font-bold">3D</span>
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto shadow-lg shadow-blue-500/15">
              <div className="w-3.5 h-3.5 bg-white rounded-sm"></div>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute right-[-12px] top-6 w-6 h-6 rounded-full bg-slate-950 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer z-20 shadow-md"
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-4 mb-6">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center justify-center gap-2.5 px-3 py-2.5 bg-white/5 text-white hover:bg-white/10 rounded-xl border border-white/10 text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-lg hover:shadow-white/5 ${
              collapsed ? "aspect-square p-0" : ""
            }`}
            title="New Research"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            {!collapsed && <span className="text-slate-100">New Search</span>}
          </button>
        </div>

        {/* Search History List */}
        <div className="flex-1 px-3 pb-4 overflow-y-auto scrollbar-thin">
          {!collapsed && (
            <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3 font-semibold px-2">
              Recent Threads
            </div>
          )}

          {sessions.length === 0 ? (
            !collapsed && (
              <div className="text-center py-6 text-xs text-white/20 italic">
                No threads started yet
              </div>
            )
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    className={`group relative flex items-center rounded-xl transition-all ${
                      isActive
                        ? "bg-white/5 border border-white/10 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/2"
                    }`}
                  >
                    <button
                      onClick={() => onSelectSession(session.id)}
                      className="flex-1 flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium truncate cursor-pointer overflow-hidden"
                      title={session.title}
                    >
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-blue-400" : "text-white/30"}`} />
                      {!collapsed && <span className="truncate">{session.title}</span>}
                    </button>

                    {!collapsed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute right-2 p-1 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                        title="Delete Thread"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel & Badge Section */}
      <div className="border-t border-white/5 bg-slate-950/60 p-1">
        {/* Live settings flyout */}
        {showSettings && !collapsed && (
          <div className="p-3 bg-[#121212] border border-white/10 rounded-t-xl mx-2 mt-2 space-y-3 animate-slideUp">
            <div className="text-xs font-semibold text-slate-300 pb-1 border-b border-white/5">
              Preferences
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">3D Constellation</span>
              <button
                onClick={onToggleBg3D}
                className="text-slate-400 hover:text-blue-400 cursor-pointer"
              >
                {bg3DEnabled ? (
                  <ToggleRight className="w-6 h-6 text-blue-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-600" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Voice Assistant</span>
              <button
                onClick={onToggleVoice}
                className="text-slate-400 hover:text-blue-400 cursor-pointer"
              >
                {voiceEnabled ? (
                  <ToggleRight className="w-6 h-6 text-blue-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-slate-600" />
                )}
              </button>
            </div>
            <div className="text-[10px] text-slate-500">
              Model: <span className="text-blue-400 font-semibold">Gemini 3.5 Flash</span>
            </div>
          </div>
        )}

        {/* Profile/Assistant Bio Box */}
        <div className="p-3 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar block with custom status indication */}
            <div className="relative flex-shrink-0">
              <img
                src={avatarUrl}
                alt="Sophia Avatar"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-white/10 ring-2 ring-blue-500/10"
              />
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-slate-950 animate-pulse" />
            </div>

            {!collapsed && (
              <div className="text-left min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">Sophia</p>
                <p className="text-[10px] text-blue-400 font-medium truncate flex items-center gap-1">
                  AI Companion
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer ${
                showSettings ? "bg-white/5 text-blue-400" : ""
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

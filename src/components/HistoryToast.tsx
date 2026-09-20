import React from "react";
import { Undo2, Redo2, Sparkles } from "lucide-react";

interface HistoryToastProps {
  lastAction: {
    message: string;
    type: "undo" | "redo" | "update";
  } | null;
}

export const HistoryToast: React.FC<HistoryToastProps> = ({ lastAction }) => {
  if (!lastAction) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-lg backdrop-blur-md border border-slate-700/80 animate-in fade-in slide-in-from-bottom-2">
        {lastAction.type === "undo" && (
          <Undo2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        )}
        {lastAction.type === "redo" && (
          <Redo2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        )}
        {lastAction.type === "update" && (
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        )}
        <span>{lastAction.message}</span>
      </div>
    </div>
  );
};

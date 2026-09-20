import React, { useState, useRef, useEffect } from "react";
import { Undo2, Redo2, History, ChevronDown, Check, Clock } from "lucide-react";
import { ConfigHistoryEntry } from "../types";

interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  past: ConfigHistoryEntry[];
  future: ConfigHistoryEntry[];
  onJumpToPast?: (index: number) => void;
  onJumpToFuture?: (index: number) => void;
  variant?: "header" | "compact" | "editor";
}

export const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  past,
  future,
  onJumpToPast,
  onJumpToFuture,
  variant = "header",
}) => {
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowHistoryDropdown(false);
      }
    };
    if (showHistoryDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showHistoryDropdown]);

  const lastPastAction = past.length > 0 ? past[past.length - 1].description : null;
  const nextFutureAction = future.length > 0 ? future[0].description : null;
  const totalAdjustments = past.length + future.length;

  const isMac =
    typeof window !== "undefined" &&
    navigator.platform &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const cmdKey = isMac ? "⌘" : "Ctrl+";

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Button Group */}
      <div className="inline-flex items-center bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 rounded-xl p-0.5 shadow-2xs">
        {/* Undo Button */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title={
            canUndo
              ? `Undo ${lastPastAction ? `"${lastPastAction}"` : ""} (${cmdKey}Z)`
              : `Undo (${cmdKey}Z)`
          }
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            canUndo
              ? "text-slate-700 hover:text-slate-900 hover:bg-white hover:shadow-2xs active:scale-95"
              : "text-slate-300 cursor-not-allowed"
          }`}
          aria-label="Undo recent adjustment"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className={variant === "header" ? "hidden md:inline text-[11px]" : "hidden sm:inline text-[11px]"}>
            Undo
          </span>
          {canUndo && (
            <span className="hidden lg:inline text-[10px] text-slate-400 font-mono font-normal">
              {cmdKey}Z
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-slate-200/90 my-auto" />

        {/* Redo Button */}
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title={
            canRedo
              ? `Redo ${nextFutureAction ? `"${nextFutureAction}"` : ""} (${cmdKey}${isMac ? "⇧Z" : "Y"})`
              : `Redo (${cmdKey}${isMac ? "⇧Z" : "Y"})`
          }
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            canRedo
              ? "text-slate-700 hover:text-slate-900 hover:bg-white hover:shadow-2xs active:scale-95"
              : "text-slate-300 cursor-not-allowed"
          }`}
          aria-label="Redo adjustment"
        >
          <Redo2 className="w-3.5 h-3.5" />
          <span className={variant === "header" ? "hidden md:inline text-[11px]" : "hidden sm:inline text-[11px]"}>
            Redo
          </span>
          {canRedo && (
            <span className="hidden lg:inline text-[10px] text-slate-400 font-mono font-normal">
              {isMac ? "⌘⇧Z" : "Ctrl+Y"}
            </span>
          )}
        </button>

        {/* History Timeline Trigger */}
        {totalAdjustments > 0 && (
          <>
            <div className="w-[1px] h-4 bg-slate-200/90 my-auto" />
            <button
              type="button"
              onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
              title="View adjustments history timeline"
              className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                showHistoryDropdown
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
              }`}
              aria-label="Toggle adjustment history dropdown"
            >
              <History className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono px-1 rounded bg-slate-200/70 text-slate-700">
                {past.length}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showHistoryDropdown ? "rotate-180" : ""}`} />
            </button>
          </>
        )}
      </div>

      {/* History Timeline Popover */}
      {showHistoryDropdown && totalAdjustments > 0 && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 mb-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Adjustment History</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {past.length} past • {future.length} redo
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 p-1 scrollbar-thin">
            {/* Future redo items (listed in reverse so closest next redo is right above current) */}
            {future.length > 0 && (
              <div className="space-y-0.5 mb-1 pb-1 border-b border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-0.5 uppercase tracking-wider">
                  Redo Steps
                </div>
                {future.map((step, idx) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (onJumpToFuture) {
                        onJumpToFuture(idx);
                        setShowHistoryDropdown(false);
                      }
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50/60 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Redo2 className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
                      <span className="truncate text-xs">{step.description}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover:text-blue-600 shrink-0 font-mono">
                      +{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Current State Indicator */}
            <div className="px-2.5 py-1.5 rounded-lg bg-blue-50/80 border border-blue-200/80 text-blue-700 font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-xs">Current State</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-blue-600 text-white px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>

            {/* Past items (from most recent down to oldest) */}
            {past.length > 0 && (
              <div className="space-y-0.5 mt-1 pt-1">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-0.5 uppercase tracking-wider">
                  Past Adjustments (Click to revert)
                </div>
                {[...past].reverse().map((step, reverseIdx) => {
                  const actualPastIndex = past.length - 1 - reverseIdx;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        if (onJumpToPast) {
                          onJumpToPast(actualPastIndex);
                          setShowHistoryDropdown(false);
                        }
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Undo2 className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
                        <span className="truncate text-xs font-medium">{step.description}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 group-hover:text-blue-600 shrink-0 font-mono">
                        -{reverseIdx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2 mt-1 border-t border-slate-100 px-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>Tip: Press {cmdKey}Z or {cmdKey}{isMac ? "⇧Z" : "Y"}</span>
            <span>Up to 40 steps</span>
          </div>
        </div>
      )}
    </div>
  );
};

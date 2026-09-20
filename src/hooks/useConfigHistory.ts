import { useState, useRef, useCallback, useEffect } from "react";
import { NewsConfig, ConfigHistoryEntry } from "../types";

const MAX_HISTORY_LENGTH = 40;
const CONTINUOUS_DEBOUNCE_MS = 750;

// Keys that are often adjusted continuously (typing or dragging sliders)
const CONTINUOUS_KEYS: (keyof NewsConfig)[] = [
  "headline",
  "caption",
  "commentCalloutText",
  "watermarkText",
  "publisherName",
  "publisherHandle",
  "quoteAuthor",
  "overlayOpacity",
  "imageZoom",
  "imageOffsetY",
];

export function getAutoActionDescription(updates: Partial<NewsConfig>): string {
  const keys = Object.keys(updates) as (keyof NewsConfig)[];
  if (keys.length === 0) return "Adjustment";
  if (keys.length === 1) {
    const key = keys[0];
    switch (key) {
      case "headline":
        return "Edit Headline";
      case "caption":
        return "Edit Caption";
      case "template":
        return `Template: ${updates.template}`;
      case "aspectRatio":
        return `Aspect Ratio: ${updates.aspectRatio}`;
      case "badge":
        return updates.badge?.trim() ? `Badge: ${updates.badge}` : "Clear Badge";
      case "badgeColor":
        return "Badge Color";
      case "activeImageUrl":
        return "Change Image";
      case "imageFilter":
        return `Filter: ${updates.imageFilter}`;
      case "fontFamily":
        return `Font: ${updates.fontFamily}`;
      case "headlineSize":
        return `Headline Size: ${updates.headlineSize?.toUpperCase()}`;
      case "overlayOpacity":
        return `Overlay: ${updates.overlayOpacity}%`;
      case "imageZoom":
        return `Image Zoom: ${updates.imageZoom}%`;
      case "imageOffsetY":
        return `Image Position: ${updates.imageOffsetY}%`;
      case "showCommentCallout":
        return updates.showCommentCallout ? "Show Callout Box" : "Hide Callout Box";
      case "commentCalloutText":
        return "Callout Text";
      case "commentCalloutStyle":
        return `Callout Style: ${updates.commentCalloutStyle}`;
      case "commentCalloutBg":
        return "Callout Color";
      case "commentCalloutUppercase":
        return updates.commentCalloutUppercase ? "Callout UPPERCASE" : "Callout Natural Case";
      case "showLogo":
        return updates.showLogo ? "Show Logo" : "Hide Logo";
      case "logoUrl":
        return "Change Logo";
      case "logoPosition":
        return `Logo: ${updates.logoPosition}`;
      case "logoSize":
        return `Logo Size: ${updates.logoSize}`;
      case "showWatermark":
        return updates.showWatermark ? "Show Watermark" : "Hide Watermark";
      case "watermarkText":
        return "Watermark Text";
      case "publisherName":
        return "Publisher Name";
      case "publisherHandle":
        return "Publisher Handle";
      case "showDate":
        return updates.showDate ? "Show Date" : "Hide Date";
      case "customDate":
        return "Date Text";
      case "isVerified":
        return updates.isVerified ? "Add Verified Badge" : "Remove Verified Badge";
      case "quoteAuthor":
        return "Quote Attribution";
      case "showTopBar":
        return updates.showTopBar ? "Show Top Bar" : "Hide Top Bar";
      default:
        return `Update ${key}`;
    }
  }

  // Multi-key updates
  if (updates.headline && updates.caption && updates.activeImageUrl) {
    return "Load Article Content";
  }
  return `Adjust ${keys.length} Properties`;
}

export interface UseConfigHistoryReturn {
  config: NewsConfig;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  updateConfig: (updates: Partial<NewsConfig>, customDescription?: string) => void;
  resetConfig: (newConfig: NewsConfig, description?: string) => void;
  past: ConfigHistoryEntry[];
  future: ConfigHistoryEntry[];
  lastAction: { message: string; type: "undo" | "redo" | "update" } | null;
  jumpToPast: (index: number) => void;
  jumpToFuture: (index: number) => void;
}

export function useConfigHistory(initialConfig: NewsConfig): UseConfigHistoryReturn {
  const [past, setPast] = useState<ConfigHistoryEntry[]>([]);
  const [present, setPresent] = useState<NewsConfig>(initialConfig);
  const [future, setFuture] = useState<ConfigHistoryEntry[]>([]);
  const [lastAction, setLastAction] = useState<{
    message: string;
    type: "undo" | "redo" | "update";
  } | null>(null);

  // Tracking for debounced continuous updates
  const lastUpdateRef = useRef<{
    time: number;
    keys: (keyof NewsConfig)[];
    description: string;
  }>({
    time: 0,
    keys: [],
    description: "",
  });

  // Clear toast after 2.5s
  useEffect(() => {
    if (!lastAction) return;
    const timer = setTimeout(() => {
      setLastAction(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [lastAction]);

  /**
   * Update configuration with smart batching for continuous slider/typing changes
   */
  const updateConfig = useCallback(
    (updates: Partial<NewsConfig>, customDescription?: string) => {
      const keys = Object.keys(updates) as (keyof NewsConfig)[];
      if (keys.length === 0) return;

      const now = Date.now();
      const description = customDescription || getAutoActionDescription(updates);

      // Check if all updated keys are continuous
      const isContinuous = keys.every((k) => CONTINUOUS_KEYS.includes(k));
      const sameKeysAsLast =
        lastUpdateRef.current.keys.length === keys.length &&
        keys.every((k) => lastUpdateRef.current.keys.includes(k));

      const isWithinContinuousWindow =
        isContinuous &&
        sameKeysAsLast &&
        now - lastUpdateRef.current.time < CONTINUOUS_DEBOUNCE_MS;

      setPresent((prevPresent) => {
        const nextPresent = { ...prevPresent, ...updates };

        if (isWithinContinuousWindow) {
          // Continuous change in the same property (e.g. typing or dragging slider)
          // Do not create a new past entry; keep the baseline state from before the edit sequence started.
          lastUpdateRef.current = {
            time: now,
            keys,
            description,
          };
          return nextPresent;
        }

        // Discrete change or new edit session: push current present to past
        setPast((prevPast) => {
          const newEntry: ConfigHistoryEntry = {
            id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
            config: prevPresent,
            description: lastUpdateRef.current.description || description,
            timestamp: now,
          };
          const updated = [...prevPast, newEntry];
          if (updated.length > MAX_HISTORY_LENGTH) {
            return updated.slice(updated.length - MAX_HISTORY_LENGTH);
          }
          return updated;
        });

        // Any new action clears the redo future
        setFuture([]);

        lastUpdateRef.current = {
          time: now,
          keys,
          description,
        };

        return nextPresent;
      });
    },
    []
  );

  /**
   * Undo to previous state
   */
  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;

      const previousEntry = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, prevPast.length - 1);

      setPresent((currentPresent) => {
        // Push current present to future redo stack
        const redoEntry: ConfigHistoryEntry = {
          id: `future-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          config: currentPresent,
          description: previousEntry.description || "Adjustment",
          timestamp: Date.now(),
        };

        setFuture((prevFuture) => [redoEntry, ...prevFuture]);

        setLastAction({
          message: `Reverted: ${previousEntry.description}`,
          type: "undo",
        });

        // Reset continuous tracker so next edit starts fresh
        lastUpdateRef.current = { time: 0, keys: [], description: "" };

        return previousEntry.config;
      });

      return newPast;
    });
  }, []);

  /**
   * Redo forward to next state
   */
  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;

      const nextEntry = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      setPresent((currentPresent) => {
        // Push current present to past undo stack
        const undoEntry: ConfigHistoryEntry = {
          id: `past-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          config: currentPresent,
          description: nextEntry.description || "Adjustment",
          timestamp: Date.now(),
        };

        setPast((prevPast) => {
          const updated = [...prevPast, undoEntry];
          if (updated.length > MAX_HISTORY_LENGTH) {
            return updated.slice(updated.length - MAX_HISTORY_LENGTH);
          }
          return updated;
        });

        setLastAction({
          message: `Restored: ${nextEntry.description}`,
          type: "redo",
        });

        lastUpdateRef.current = { time: 0, keys: [], description: "" };

        return nextEntry.config;
      });

      return newFuture;
    });
  }, []);

  /**
   * Jump back directly to a specific state in the past stack (0 to past.length - 1)
   */
  const jumpToPast = useCallback((index: number) => {
    setPast((prevPast) => {
      if (index < 0 || index >= prevPast.length) return prevPast;

      const targetEntry = prevPast[index];
      const remainingPast = prevPast.slice(0, index);
      const intermediatePast = prevPast.slice(index + 1);

      setPresent((currentPresent) => {
        // All states after index + currentPresent become future entries
        const currentAsEntry: ConfigHistoryEntry = {
          id: `future-${Date.now()}`,
          config: currentPresent,
          description: targetEntry.description,
          timestamp: Date.now(),
        };

        setFuture((prevFuture) => [...intermediatePast, currentAsEntry, ...prevFuture]);

        setLastAction({
          message: `Jumped back to: ${targetEntry.description}`,
          type: "undo",
        });

        lastUpdateRef.current = { time: 0, keys: [], description: "" };
        return targetEntry.config;
      });

      return remainingPast;
    });
  }, []);

  /**
   * Jump forward to a specific state in the future stack (0 to future.length - 1)
   */
  const jumpToFuture = useCallback((index: number) => {
    setFuture((prevFuture) => {
      if (index < 0 || index >= prevFuture.length) return prevFuture;

      const targetEntry = prevFuture[index];
      const itemsToMoveToPast = prevFuture.slice(0, index);
      const remainingFuture = prevFuture.slice(index + 1);

      setPresent((currentPresent) => {
        const currentAsEntry: ConfigHistoryEntry = {
          id: `past-${Date.now()}`,
          config: currentPresent,
          description: targetEntry.description,
          timestamp: Date.now(),
        };

        setPast((prevPast) => [...prevPast, currentAsEntry, ...itemsToMoveToPast]);

        setLastAction({
          message: `Jumped forward to: ${targetEntry.description}`,
          type: "redo",
        });

        lastUpdateRef.current = { time: 0, keys: [], description: "" };
        return targetEntry.config;
      });

      return remainingFuture;
    });
  }, []);

  /**
   * Reset config (e.g. loading a new article) with optional history checkpoint
   */
  const resetConfig = useCallback((newConfig: NewsConfig, description = "Load New Article") => {
    setPresent((currentPresent) => {
      setPast((prevPast) => {
        const newEntry: ConfigHistoryEntry = {
          id: `reset-${Date.now()}`,
          config: currentPresent,
          description,
          timestamp: Date.now(),
        };
        return [...prevPast, newEntry];
      });
      setFuture([]);
      lastUpdateRef.current = { time: 0, keys: [], description: "" };
      setLastAction({
        message: description,
        type: "update",
      });
      return newConfig;
    });
  }, []);

  // Global Keyboard Shortcuts (Cmd+Z, Ctrl+Z, Cmd+Shift+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (!isCmdOrCtrl) return;

      const key = e.key.toLowerCase();

      // Undo: Ctrl+Z or Cmd+Z (without Shift)
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z, Cmd+Shift+Z, Ctrl+Y, Cmd+Y
      if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    config: present,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    updateConfig,
    resetConfig,
    past,
    future,
    lastAction,
    jumpToPast,
    jumpToFuture,
  };
}

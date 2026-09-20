import React, { useRef, useEffect, useState } from "react";
import {
  Download,
  Copy,
  Check,
  Smartphone,
  Eye,
  RefreshCw,
  Share2,
  Maximize2,
  ThumbsUp,
  MessageCircle,
  Share,
  MoreHorizontal,
  Globe,
} from "lucide-react";
import { NewsConfig, AspectRatio, AiEnhanceResult, ConfigHistoryEntry } from "../types";
import { renderNewsCardToCanvas, getCanvasDimensions } from "../utils/canvasRenderer";
import { UndoRedoControls } from "./UndoRedoControls";

interface NewsPreviewCanvasProps {
  config: NewsConfig;
  aiResult: AiEnhanceResult | null;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  past?: ConfigHistoryEntry[];
  future?: ConfigHistoryEntry[];
  onJumpToPast?: (index: number) => void;
  onJumpToFuture?: (index: number) => void;
}

export const NewsPreviewCanvas: React.FC<NewsPreviewCanvasProps> = ({
  config,
  aiResult,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  past,
  future,
  onJumpToPast,
  onJumpToFuture,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [showFeedMock, setShowFeedMock] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");

  // Re-render canvas whenever config changes
  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      if (!canvasRef.current) return;
      setIsRendering(true);
      try {
        await renderNewsCardToCanvas(canvasRef.current, config);
        if (!isCancelled && canvasRef.current) {
          setPreviewDataUrl(canvasRef.current.toDataURL("image/png"));
        }
      } catch (err) {
        console.error("Canvas render error:", err);
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    // Debounce slightly for smooth sliding
    const timer = setTimeout(render, 60);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [config]);

  // Download Handler
  const handleDownload = (format: "png" | "jpeg" = "png") => {
    if (!canvasRef.current) return;
    const mime = format === "png" ? "image/png" : "image/jpeg";
    const quality = format === "png" ? undefined : 0.92;
    const dataUrl = canvasRef.current.toDataURL(mime, quality);

    const safeHeadline = (config.headline || "facebook-news-image")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);

    const link = document.createElement("a");
    link.download = `${safeHeadline}-${config.aspectRatio.replace(":", "x")}.${format}`;
    link.href = dataUrl;
    link.click();
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2000);
        } catch (err) {
          console.warn("ClipboardItem write failed, fallback to data url", err);
          // Fallback download if clipboard image copy restricted
          handleDownload("png");
        }
      }, "image/png");
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  const { width, height } = getCanvasDimensions(config.aspectRatio);
  const aspectRatioFraction = `${width} / ${height}`;

  return (
    <div className="flex flex-col space-y-4">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Live Preview
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            {width} × {height}px ({config.aspectRatio})
          </span>
          {isRendering && (
            <span className="text-[11px] text-blue-600 flex items-center gap-1 font-medium animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Rendering...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canUndo !== undefined && (
            <UndoRedoControls
              canUndo={canUndo}
              canRedo={canRedo || false}
              onUndo={onUndo || (() => {})}
              onRedo={onRedo || (() => {})}
              past={past || []}
              future={future || []}
              onJumpToPast={onJumpToPast}
              onJumpToFuture={onJumpToFuture}
              variant="compact"
            />
          )}

          <button
            type="button"
            onClick={() => setShowFeedMock(!showFeedMock)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              showFeedMock
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Facebook Feed Mock</span>
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      {!showFeedMock ? (
        <div className="relative bg-slate-900/95 rounded-2xl p-4 sm:p-6 flex items-center justify-center border border-slate-800 shadow-xl overflow-hidden min-h-[420px]">
          {/* Subtle checkered backdrop for canvas preview */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #0f172a 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Canvas Element */}
          <div
            className="relative w-full max-w-[540px] shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10 transition-all duration-300"
            style={{ aspectRatio: aspectRatioFraction }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain block select-none"
            />

            {/* Template badge overlay indicator */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-[10px] font-bold text-white/90 border border-white/10 uppercase tracking-wider pointer-events-none">
              {config.template} template
            </div>
          </div>
        </div>
      ) : (
        /* Facebook Feed Mobile Post Simulator */
        <div className="bg-slate-100 rounded-2xl p-4 sm:p-6 flex justify-center border border-slate-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Facebook Post Header */}
            <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                {config.showLogo && config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt="Publisher Logo"
                    className="w-10 h-10 rounded-full object-cover border border-amber-300/40 shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {config.publisherName?.charAt(0) || "N"}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {config.publisherName || "News Desk"}
                    </span>
                    {config.isVerified && (
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span>{config.customDate || "2 hrs"}</span>
                    <span>•</span>
                    <Globe className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Post Caption Body */}
            <div className="px-3.5 py-2.5 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {aiResult?.fbPostCaption ? (
                aiResult.fbPostCaption
              ) : (
                <>
                  <p className="font-semibold text-slate-900 mb-1">{config.headline}</p>
                  <p className="text-slate-600 mb-2">{config.caption}</p>
                  <p className="text-blue-600">#BreakingNews #NewsAlert #{config.badge.replace(/\s+/g, "")}</p>
                </>
              )}
            </div>

            {/* Rendered News Graphic */}
            <div className="relative w-full bg-slate-900 overflow-hidden" style={{ aspectRatio: aspectRatioFraction }}>
              {previewDataUrl ? (
                <img src={previewDataUrl} alt="Facebook news preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  Generating preview...
                </div>
              )}
            </div>

            {/* Social Counts */}
            <div className="px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[9px] text-white">
                  👍
                </span>
                <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] text-white">
                  ❤️
                </span>
                <span>2.4K</span>
              </div>
              <div className="flex items-center gap-3">
                <span>384 Comments</span>
                <span>1.1K Shares</span>
              </div>
            </div>

            {/* Social Action Buttons */}
            <div className="grid grid-cols-3 py-1 border-t border-slate-100 text-xs font-semibold text-slate-600">
              <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-slate-50 transition cursor-pointer">
                <ThumbsUp className="w-4 h-4" />
                <span>Like</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-slate-50 transition cursor-pointer">
                <MessageCircle className="w-4 h-4" />
                <span>Comment</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-slate-50 transition cursor-pointer">
                <Share className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>

            {/* Pinned First Comment (Matches the red callout box) */}
            {config.showCommentCallout && (
              <div className="bg-slate-50 p-3 border-t border-slate-100 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>📌 Pinned Top Comment</span>
                  <span>•</span>
                  <span className="text-red-600 font-semibold">First Comment Link</span>
                </div>
                <div className="flex items-start gap-2.5">
                  {config.showLogo && config.logoUrl ? (
                    <img
                      src={config.logoUrl}
                      alt="Publisher Logo"
                      className="w-8 h-8 rounded-full object-cover border border-amber-300/40 shrink-0 shadow-xs"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                      {config.publisherName?.charAt(0) || "N"}
                    </div>
                  )}
                  <div className="flex-1 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-xs font-bold text-slate-900">
                        {config.publisherName || "News Desk"}
                      </span>
                      {config.isVerified && (
                        <span className="w-3 h-3 rounded-full bg-blue-600 text-white flex items-center justify-center text-[7px] font-bold">
                          ✓
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium ml-1">Author</span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      🔗 Full article, source data and live updates:{" "}
                      <span className="text-blue-600 underline font-medium cursor-pointer">
                        https://{config.watermarkText || "news.com"}/story-details
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Action Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-600 text-center sm:text-left">
          <p className="font-semibold text-slate-900">Ready to publish to Facebook</p>
          <p className="text-slate-500">High-resolution export rendered at 100% crisp retina quality.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center w-full sm:w-auto">
          {/* Copy Image Button */}
          <button
            type="button"
            onClick={handleCopyImage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition cursor-pointer border border-slate-200"
            title="Copy image to clipboard to paste directly into Facebook"
          >
            {copiedImage ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copy Image</span>
              </>
            )}
          </button>

          {/* Download PNG (Primary) */}
          <button
            type="button"
            onClick={() => handleDownload("png")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>

          {/* Download JPG */}
          <button
            type="button"
            onClick={() => handleDownload("jpeg")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition border border-slate-200 cursor-pointer"
          >
            <span>JPG</span>
          </button>
        </div>
      </div>
    </div>
  );
};

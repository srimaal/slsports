import React, { useState } from "react";
import {
  Link as LinkIcon,
  Search,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { ArticleData } from "../types";
import { SAMPLE_ARTICLES } from "../data/sampleArticles";

interface UrlFetcherProps {
  onArticleFetched: (article: ArticleData) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  currentArticle: ArticleData | null;
  activeImageUrl: string;
  onSelectImage: (imageUrl: string) => void;
}

export const UrlFetcher: React.FC<UrlFetcherProps> = ({
  onArticleFetched,
  isLoading,
  setIsLoading,
  currentArticle,
  activeImageUrl,
  onSelectImage,
}) => {
  const [inputUrl, setInputUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchStatusStep, setFetchStatusStep] = useState<string>("");

  const handleFetch = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || inputUrl).trim();
    if (!targetUrl) {
      setErrorMessage("Please enter an article URL (e.g. https://edition.cnn.com/...)");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setFetchStatusStep("Connecting to website...");

    try {
      const timer1 = setTimeout(() => setFetchStatusStep("Parsing OpenGraph metadata & article headers..."), 400);
      const timer2 = setTimeout(() => setFetchStatusStep("Extracting lead image and news caption..."), 900);

      const res = await fetch("/api/fetch-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch website article");
      }

      onArticleFetched(data);
      setInputUrl(targetUrl);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setErrorMessage(
        err.message ||
          "Could not read article from this URL. Make sure the link is public, or try one of the sample articles below."
      );
    } finally {
      setIsLoading(false);
      setFetchStatusStep("");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        handleFetch(text);
      }
    } catch {
      // Clipboard read permission might be blocked
    }
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSelectImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 transition">
      {/* Search Input Bar */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Article Website URL
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              type="url"
              placeholder="Paste article URL (e.g. https://www.bbc.com/news/...)"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleFetch();
                }
              }}
              className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {/* Paste quick button */}
            {!inputUrl && (
              <button
                type="button"
                onClick={handlePaste}
                className="absolute inset-y-1.5 right-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1"
                title="Paste from clipboard"
              >
                Paste
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleFetch()}
            disabled={isLoading || !inputUrl.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm transition shadow-sm shadow-blue-500/20 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Fetch Article</span>
              </>
            )}
          </button>
        </div>

        {/* Loading status steps */}
        {isLoading && fetchStatusStep && (
          <div className="flex items-center gap-2 text-xs text-blue-600 animate-pulse font-medium bg-blue-50/70 px-3 py-2 rounded-lg border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            {fetchStatusStep}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to fetch website</p>
              <p className="mt-0.5 text-red-600">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Quick sample chips */}
        <div className="pt-1 flex items-center flex-wrap gap-1.5 text-xs">
          <span className="text-slate-600 font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Try quick sample:
          </span>
          {SAMPLE_ARTICLES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputUrl(sample.data.url);
                onArticleFetched(sample.data);
                setErrorMessage(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer border border-slate-200/60"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Extracted Article Status & Image Selector */}
      {currentArticle && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {currentArticle.favicon && (
                <img
                  src={currentArticle.favicon}
                  alt=""
                  className="w-4 h-4 rounded-sm shrink-0"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <span className="text-xs font-semibold text-slate-900 truncate">
                {currentArticle.siteName || currentArticle.domain}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                • {currentArticle.domain}
              </span>
            </div>

            <a
              href={currentArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0 font-medium"
            >
              <span>Visit</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Candidate Images Carousel */}
          {currentArticle.candidateImages && currentArticle.candidateImages.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Article Images ({currentArticle.candidateImages.length})
                </span>
                <label className="text-[11px] font-medium text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>Upload custom photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {currentArticle.candidateImages.map((imgUrl, idx) => {
                  const isSelected = activeImageUrl === imgUrl;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectImage(imgUrl)}
                      className={`relative shrink-0 w-16 h-14 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                        isSelected
                          ? "border-blue-600 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={`/api/proxy-image?url=${encodeURIComponent(imgUrl)}`}
                        alt={`Candidate ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback directly
                          e.currentTarget.src = imgUrl;
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

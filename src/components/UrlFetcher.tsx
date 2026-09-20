import React, { useState, useEffect } from "react";
import {
  Link as LinkIcon,
  Search,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Flame,
} from "lucide-react";
import { ArticleData } from "../types";
import { SAMPLE_ARTICLES } from "../data/sampleArticles";
import { extractArticleClientSide } from "../utils/clientArticleExtractor";

interface UrlFetcherProps {
  onArticleFetched: (article: ArticleData) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  currentArticle: ArticleData | null;
  activeImageUrl: string;
  onSelectImage: (imageUrl: string) => void;
}

// Helper to normalize and validate slsports.lk URLs
export function normalizeSlSportsUrl(rawInput: string): { url: string; isValid: boolean; reason?: string } {
  let trimmed = rawInput.trim();
  if (!trimmed) {
    return { url: "", isValid: false, reason: "Please enter an article URL or slug from slsports.lk" };
  }

  // Prepend scheme if missing
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    if (trimmed.startsWith("slsports.lk") || trimmed.startsWith("www.slsports.lk")) {
      trimmed = "https://" + trimmed;
    } else if (!trimmed.includes(".")) {
      // User entered slug or path like "team-sri-lanka..." or "/team-sri-lanka..."
      trimmed = "https://slsports.lk/" + trimmed.replace(/^\/+/, "");
    } else {
      trimmed = "https://" + trimmed;
    }
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "slsports.lk") {
      return {
        url: trimmed,
        isValid: false,
        reason: `Only articles on https://slsports.lk/ can be fetched. "${host}" is not supported.`,
      };
    }
    return { url: trimmed, isValid: true };
  } catch {
    return { url: trimmed, isValid: false, reason: "Invalid URL structure." };
  }
}

export function parseSlugToHeadline(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    const segments = u.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    const slug = segments[segments.length - 1] || "";
    if (slug && slug !== "wp-admin" && slug !== "feed") {
      const words = slug.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
      return words.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  } catch {
    // ignore
  }
  return "SL Sports News Update";
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
  const [liveArticles, setLiveArticles] = useState<ArticleData[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(false);
  const [showLiveDrawer, setShowLiveDrawer] = useState<boolean>(false);

  // Fetch live articles from slsports.lk feed
  const loadLiveFeed = async () => {
    setIsLoadingFeed(true);
    try {
      const res = await fetch("/api/slsports-feed");
      if (res.ok) {
        const text = await res.text();
        if (text && (text.trim().startsWith("{") || text.trim().startsWith("["))) {
          try {
            const data = JSON.parse(text);
            if (data?.success && Array.isArray(data.articles) && data.articles.length > 0) {
              setLiveArticles(data.articles);
            }
          } catch {
            // ignore non-json feed
          }
        }
      }
    } catch (err) {
      console.warn("Could not load live slsports.lk feed:", err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    loadLiveFeed();
  }, []);

  const handleFetch = async (urlToFetch?: string) => {
    const rawTarget = (urlToFetch || inputUrl).trim();
    if (!rawTarget) {
      setErrorMessage("Please enter an article URL from https://slsports.lk/");
      return;
    }

    // STRICT DOMAIN RESTRICTION CHECK
    const check = normalizeSlSportsUrl(rawTarget);
    if (!check.isValid) {
      setErrorMessage(check.reason || "Only articles from https://slsports.lk/ are allowed.");
      return;
    }

    const targetUrl = check.url;
    setErrorMessage(null);
    setIsLoading(true);
    setFetchStatusStep("Connecting to slsports.lk...");

    try {
      const timer1 = setTimeout(() => setFetchStatusStep("Parsing SL Sports metadata & story headers..."), 400);
      const timer2 = setTimeout(() => setFetchStatusStep("Extracting lead sports photo and match details..."), 900);

      let articleData: ArticleData | null = null;

      try {
        const res = await fetch("/api/fetch-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        });

        clearTimeout(timer1);
        clearTimeout(timer2);

        const text = await res.text();
        let data: any = null;
        if (text && (text.trim().startsWith("{") || text.trim().startsWith("["))) {
          try {
            data = JSON.parse(text);
          } catch {
            data = null;
          }
        }

        if (res.ok && data?.success) {
          articleData = data;
        } else if (data?.error && data.error.includes("slsports.lk only")) {
          throw new Error(data.error);
        }
      } catch (networkErr: any) {
        if (networkErr?.message && networkErr.message.includes("slsports.lk only")) {
          throw networkErr;
        }
        console.warn("Server API fetch warning, attempting client fallback...", networkErr);
      }

      // If server API was unavailable, returned HTML, or failed, use client-side extractor
      if (!articleData) {
        setFetchStatusStep("Extracting article directly from slsports.lk...");
        try {
          articleData = await extractArticleClientSide(targetUrl);
        } catch (clientErr) {
          console.warn("Client side extraction fallback warning:", clientErr);
        }
      }

      // If still null, extract headline from URL slug so user is NEVER blocked
      if (!articleData || !articleData.title) {
        const slugHeadline = parseSlugToHeadline(targetUrl);
        articleData = {
          url: targetUrl,
          domain: "slsports.lk",
          title: slugHeadline,
          originalTitle: slugHeadline,
          description: "Read the latest developing sports coverage and match report on slsports.lk.",
          featuredImage: null,
          candidateImages: [],
          siteName: "SL Sports",
          author: "SL Sports Desk",
          publishedTime: "Today",
          favicon: "https://www.google.com/s2/favicons?domain=slsports.lk&sz=128",
        };
      }

      onArticleFetched(articleData);
      setInputUrl(targetUrl);
    } catch (err: any) {
      console.error("Fetch error:", err);
      // Even in exceptional errors, load fallback article from URL slug
      try {
        const slugHeadline = parseSlugToHeadline(targetUrl);
        const fallbackArticle: ArticleData = {
          url: targetUrl,
          domain: "slsports.lk",
          title: slugHeadline,
          originalTitle: slugHeadline,
          description: "Read the latest developing sports coverage and match report on slsports.lk.",
          featuredImage: null,
          candidateImages: [],
          siteName: "SL Sports",
          author: "SL Sports Desk",
          publishedTime: "Today",
          favicon: "https://www.google.com/s2/favicons?domain=slsports.lk&sz=128",
        };
        onArticleFetched(fallbackArticle);
        setInputUrl(targetUrl);
        setErrorMessage(null);
      } catch {
        setErrorMessage(
          "Connecting to slsports.lk was slow. Please paste or refine the article title below."
        );
      }
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
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <span>SL Sports Article URL</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              slsports.lk only
            </span>
          </label>
          <a
            href="https://slsports.lk/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
          >
            <span>Open slsports.lk</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              type="url"
              placeholder="https://slsports.lk/team-sri-lanka... or article slug"
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
                <span>Fetching SL Sports...</span>
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Domain Restriction</p>
              <p className="mt-0.5 text-red-600">{errorMessage}</p>
              <p className="mt-1 text-[11px] text-red-500">
                Tip: Only articles hosted on <a href="https://slsports.lk" target="_blank" rel="noreferrer" className="underline font-bold">https://slsports.lk/</a> are supported by this studio.
              </p>
            </div>
          </div>
        )}

        {/* Quick SLSports articles selector */}
        <div className="pt-1 flex items-center flex-wrap gap-1.5 text-xs">
          <span className="text-slate-600 font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Featured slsports.lk stories:
          </span>
          {SAMPLE_ARTICLES.slice(0, 4).map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputUrl(sample.data.url);
                onArticleFetched(sample.data);
                setErrorMessage(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-medium transition cursor-pointer border border-slate-200/60 flex items-center gap-1"
            >
              <span>{sample.label}</span>
            </button>
          ))}

          {liveArticles.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLiveDrawer(!showLiveDrawer)}
              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition cursor-pointer border border-blue-200/60 flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>{showLiveDrawer ? "Hide Live Feed" : `More live stories (${liveArticles.length})`}</span>
            </button>
          )}
        </div>

        {/* Expandable Live Feed from SLSports.lk */}
        {showLiveDrawer && liveArticles.length > 0 && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Latest Stories Directly From slsports.lk
              </span>
              <button
                type="button"
                onClick={loadLiveFeed}
                disabled={isLoadingFeed}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingFeed ? "animate-spin" : ""}`} />
                <span>Refresh Feed</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {liveArticles.map((art, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInputUrl(art.url);
                    handleFetch(art.url);
                  }}
                  className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition cursor-pointer flex gap-2.5 items-start group"
                >
                  {art.featuredImage ? (
                    <img
                      src={`/api/proxy-image?url=${encodeURIComponent(art.featuredImage)}`}
                      alt=""
                      className="w-12 h-12 rounded object-cover shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = art.featuredImage!;
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-600">
                      {art.title}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {art.publishedTime || "slsports.lk"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
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

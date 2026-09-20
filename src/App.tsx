/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { UrlFetcher } from "./components/UrlFetcher";
import { EditorControls } from "./components/EditorControls";
import { NewsPreviewCanvas } from "./components/NewsPreviewCanvas";
import { HistoryToast } from "./components/HistoryToast";
import { ArticleData, NewsConfig, AiEnhanceResult } from "./types";
import { SAMPLE_ARTICLES } from "./data/sampleArticles";
import { DEFAULT_SLSPORTS_LOGO_URL } from "./utils/logoAsset";
import { useConfigHistory } from "./hooks/useConfigHistory";

const INITIAL_CONFIG: NewsConfig = {
  headline: "16-Year-Old Nuyara Earns the Honor of Carrying the Sri Lankan Flag at the 20th Asian Games!",
  caption: "16-year-old Nuyara Fernando has been awarded the historic honor of leading the Sri Lankan contingent while carrying the national flag at the 20th Asian Games.",
  badge: "BREAKING NEWS",
  badgeColor: "#DC2626",
  publisherName: "SL Sports",
  publisherHandle: "@slsports_lk",
  isVerified: true,
  showDate: true,
  customDate: "Today",
  fontFamily: "impact",
  headlineSize: "md",
  overlayOpacity: 80,
  imageZoom: 100,
  imageOffsetY: 0,
  imageFilter: "cinematic",
  aspectRatio: "1:1",
  template: "breaking",
  showTopBar: false,
  showWatermark: true,
  watermarkText: "slsports.lk",
  activeImageUrl: "https://slsports.lk/wp-content/uploads/2026/09/asa-2026-09-18.jpg",
  quoteAuthor: "SL Sports Desk",
  showCommentCallout: true,
  commentCalloutText: "for more details please check the link in first comment",
  commentCalloutBg: "#DC2626",
  commentCalloutUppercase: true,
  commentCalloutStyle: "solid-bar",
  showLogo: true,
  logoUrl: DEFAULT_SLSPORTS_LOGO_URL,
  logoPosition: "bottom-left",
  logoSize: "md",
};

export default function App() {
  const [currentArticle, setCurrentArticle] = useState<ArticleData | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiEnhanceResult | null>(null);

  // Undo / Redo Configuration History State Management
  const {
    config,
    canUndo,
    canRedo,
    undo,
    redo,
    updateConfig,
    resetConfig,
    past,
    future,
    lastAction,
    jumpToPast,
    jumpToFuture,
  } = useConfigHistory(INITIAL_CONFIG);

  // Load the initial sample article on startup so the app is instantly engaging
  useEffect(() => {
    const initial = SAMPLE_ARTICLES[0].data;
    setCurrentArticle(initial);
  }, []);

  // Update configuration helper
  const handleConfigChange = (updates: Partial<NewsConfig>, actionDescription?: string) => {
    updateConfig(updates, actionDescription);
  };

  // When a new article is fetched or selected from samples
  const handleArticleLoaded = useCallback(
    (article: ArticleData) => {
      setCurrentArticle(article);

      const cleanTitle = article.title || article.originalTitle || "Breaking News Headline";
      const cleanDesc = article.description || "";
      const chosenImg =
        article.featuredImage ||
        (article.candidateImages && article.candidateImages[0]) ||
        config.activeImageUrl ||
        "https://slsports.lk/wp-content/uploads/2026/09/asa-2026-09-18.jpg";

      // Detect initial badge based on content
      const lower = `${cleanTitle} ${cleanDesc}`.toLowerCase();
      let autoBadge = "BREAKING";
      if (lower.includes("cricket") || lower.includes("runs") || lower.includes("wickets") || lower.includes("match") || lower.includes("t20") || lower.includes("ipl")) {
        autoBadge = "CRICKET";
      } else if (lower.includes("athletics") || lower.includes("track") || lower.includes("olympic")) {
        autoBadge = "ATHLETICS";
      } else if (lower.includes("football") || lower.includes("fifa")) {
        autoBadge = "FOOTBALL";
      }

      resetConfig(
        {
          ...config,
          headline: cleanTitle,
          caption: cleanDesc.slice(0, 180),
          publisherName: "SL Sports",
          publisherHandle: "@slsports_lk",
          customDate: article.publishedTime || "Today",
          watermarkText: "slsports.lk",
          activeImageUrl: chosenImg,
          badge: autoBadge,
          quoteAuthor: article.author || "SL Sports Desk",
        },
        `Load Article: ${cleanTitle.slice(0, 32)}...`
      );

      // Trigger AI enhancement for the newly loaded article
      triggerAiEnhance(cleanTitle, cleanDesc, article.siteName || article.domain);
    },
    [config, resetConfig]
  );

  // Trigger AI newsroom enhancements
  const triggerAiEnhance = async (
    titleOverride?: string,
    descOverride?: string,
    siteOverride?: string
  ) => {
    const t = titleOverride || config.headline;
    const d = descOverride || config.caption;
    const s = siteOverride || config.publisherName;

    if (!t) return;
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/ai-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          description: d,
          siteName: s,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const json = await res.json();
        if (json.success && json.data) {
          setAiResult(json.data);
          if (json.data.badge) {
            handleConfigChange({ badge: json.data.badge }, "AI Badge Suggestion");
          }
        }
      }
    } catch (err) {
      console.warn("AI enhancement could not complete:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentArticle(null);
    setAiResult(null);
    resetConfig(INITIAL_CONFIG, "Reset to Default Studio Template");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Undo/Redo Action Toast */}
      <HistoryToast lastAction={lastAction} />

      {/* Top App Header */}
      <Header
        onSelectSample={handleArticleLoaded}
        onReset={handleReset}
        hasArticle={!!currentArticle}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        past={past}
        future={future}
        onJumpToPast={jumpToPast}
        onJumpToFuture={jumpToFuture}
      />

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Article URL Scraper & Candidate Image Chooser */}
        <UrlFetcher
          onArticleFetched={handleArticleLoaded}
          isLoading={isLoadingArticle}
          setIsLoading={setIsLoadingArticle}
          currentArticle={currentArticle}
          activeImageUrl={config.activeImageUrl}
          onSelectImage={(imgUrl) => handleConfigChange({ activeImageUrl: imgUrl }, "Change Featured Photo")}
        />

        {/* Studio Grid: Editor Controls (Left) & Canvas Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Editor Controls & Customization */}
          <div className="lg:col-span-6 xl:col-span-5 order-2 lg:order-1">
            <EditorControls
              config={config}
              onChange={handleConfigChange}
              onGenerateAiEnhance={() => triggerAiEnhance()}
              aiResult={aiResult}
              isAiLoading={isAiLoading}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              past={past}
              future={future}
              onJumpToPast={jumpToPast}
              onJumpToFuture={jumpToFuture}
            />
          </div>

          {/* Right Column: High-Resolution Canvas Preview & Export */}
          <div className="lg:col-span-6 xl:col-span-7 order-1 lg:order-2 lg:sticky lg:top-20">
            <NewsPreviewCanvas
              config={config}
              aiResult={aiResult}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              past={past}
              future={future}
              onJumpToPast={jumpToPast}
              onJumpToFuture={jumpToFuture}
            />
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            SLSports Card Studio • High-impact social news graphic generator
          </p>
          <p className="text-slate-400">
            Exported images are formatted for maximum engagement across Facebook mobile and desktop feeds.
          </p>
        </div>
      </footer>
    </div>
  );
}

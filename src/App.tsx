/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { UrlFetcher } from "./components/UrlFetcher";
import { EditorControls } from "./components/EditorControls";
import { NewsPreviewCanvas } from "./components/NewsPreviewCanvas";
import { ArticleData, NewsConfig, AiEnhanceResult } from "./types";
import { SAMPLE_ARTICLES } from "./data/sampleArticles";
import { DEFAULT_SLSPORTS_LOGO_URL } from "./utils/logoAsset";

export default function App() {
  const [currentArticle, setCurrentArticle] = useState<ArticleData | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiEnhanceResult | null>(null);

  // Default configuration
  const [config, setConfig] = useState<NewsConfig>({
    headline: "Engineers Achieve 1,000-Mile EV Range With Revolutionary Solid-State Battery",
    caption: "Commercial prototype delivers 10-minute full recharge without degradation across 2,000 continuous laboratory charge cycles.",
    badge: "TECH BREAKTHROUGH",
    badgeColor: "#DC2626",
    publisherName: "TechCrunch",
    publisherHandle: "@techcrunch",
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
    showWatermark: true,
    watermarkText: "techcrunch.com",
    activeImageUrl: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=1200&auto=format&fit=crop",
    quoteAuthor: "Elena Rostova, Senior Materials Scientist",
    showCommentCallout: true,
    commentCalloutText: "for more details please check the link in first comment",
    commentCalloutBg: "#DC2626",
    commentCalloutUppercase: true,
    commentCalloutStyle: "solid-bar",
    showLogo: true,
    logoUrl: DEFAULT_SLSPORTS_LOGO_URL,
    logoPosition: "bottom-left",
    logoSize: "md",
  });

  // Load the initial sample article on startup so the app is instantly engaging
  useEffect(() => {
    const initial = SAMPLE_ARTICLES[1].data;
    setCurrentArticle(initial);
  }, []);

  // Update configuration helper
  const handleConfigChange = (updates: Partial<NewsConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  // When a new article is fetched or selected from samples
  const handleArticleLoaded = useCallback(
    (article: ArticleData) => {
      setCurrentArticle(article);

      const cleanTitle = article.title || article.originalTitle || "Breaking News Headline";
      const cleanDesc = article.description || "";
      const chosenImg = article.featuredImage || (article.candidateImages && article.candidateImages[0]) || "";

      setConfig((prev) => ({
        ...prev,
        headline: cleanTitle,
        caption: cleanDesc.slice(0, 180),
        publisherName: article.siteName || article.domain || "News Desk",
        publisherHandle: `@${article.domain.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "")}`,
        customDate: article.publishedTime || "Just now",
        watermarkText: article.domain || "",
        activeImageUrl: chosenImg || prev.activeImageUrl,
        badge: "BREAKING NEWS",
        quoteAuthor: article.author || article.siteName || "",
      }));

      // Trigger AI enhancement for the newly loaded article
      triggerAiEnhance(cleanTitle, cleanDesc, article.siteName || article.domain);
    },
    []
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

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setAiResult(json.data);
        if (json.data.badge) {
          handleConfigChange({ badge: json.data.badge });
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
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top App Header */}
      <Header
        onSelectSample={handleArticleLoaded}
        onReset={handleReset}
        hasArticle={!!currentArticle}
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
          onSelectImage={(imgUrl) => handleConfigChange({ activeImageUrl: imgUrl })}
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
            />
          </div>

          {/* Right Column: High-Resolution Canvas Preview & Export */}
          <div className="lg:col-span-6 xl:col-span-7 order-1 lg:order-2 lg:sticky lg:top-20">
            <NewsPreviewCanvas config={config} aiResult={aiResult} />
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

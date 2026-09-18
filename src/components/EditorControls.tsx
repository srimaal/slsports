import React, { useState } from "react";
import {
  Type,
  Layout,
  Palette,
  Sliders,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  ZoomIn,
  MoveVertical,
  Check,
  Copy,
  Wand2,
  MessageSquare,
  ExternalLink,
  Upload,
} from "lucide-react";
import {
  NewsConfig,
  AspectRatio,
  NewsTemplate,
  FontFamily,
  ImageFilter,
  AiEnhanceResult,
} from "../types";
import { DEFAULT_SLSPORTS_LOGO_URL } from "../utils/logoAsset";

interface EditorControlsProps {
  config: NewsConfig;
  onChange: (updates: Partial<NewsConfig>) => void;
  onGenerateAiEnhance: () => Promise<void>;
  aiResult: AiEnhanceResult | null;
  isAiLoading: boolean;
}

const TEMPLATES: { id: NewsTemplate; label: string; desc: string; icon: string }[] = [
  { id: "breaking", label: "Breaking News", desc: "Urgent red ticker & high contrast", icon: "⚡" },
  { id: "editorial", label: "Editorial", desc: "Cinematic gradient & category pill", icon: "📰" },
  { id: "split", label: "Split Slate", desc: "Top photo with clean lower news plate", icon: "📊" },
  { id: "quote", label: "Quote Card", desc: "Statement excerpt with quote glyphs", icon: "💬" },
  { id: "magazine", label: "Magazine", desc: "Framed editorial with serif typography", icon: "✨" },
  { id: "viral", label: "Viral Punch", desc: "Bold highlighted blocks for high CTR", icon: "🔥" },
];

const ASPECT_RATIOS: { id: AspectRatio; label: string; ratio: string; bestFor: string }[] = [
  { id: "1:1", label: "Square", ratio: "1:1", bestFor: "Standard Feed" },
  { id: "4:5", label: "Portrait", ratio: "4:5", bestFor: "Mobile Feed (Top CTR)" },
  { id: "1.91:1", label: "Landscape", ratio: "1.91:1", bestFor: "Link Share" },
  { id: "9:16", label: "Story", ratio: "9:16", bestFor: "Reels / Stories" },
];

const BADGE_PRESETS = [
  "BREAKING NEWS",
  "JUST IN",
  "EXCLUSIVE",
  "TECH UPDATE",
  "WORLD NEWS",
  "BUSINESS",
  "SPECIAL REPORT",
  "DEVELOPING",
];

const BADGE_COLORS = [
  { name: "Crimson Red", value: "#DC2626" },
  { name: "Facebook Blue", value: "#1877F2" },
  { name: "Emerald Green", value: "#059669" },
  { name: "Vibrant Rose", value: "#E11D48" },
  { name: "Amber Gold", value: "#D97706" },
  { name: "Deep Slate", value: "#0F172A" },
];

export const EditorControls: React.FC<EditorControlsProps> = ({
  config,
  onChange,
  onGenerateAiEnhance,
  aiResult,
  isAiLoading,
}) => {
  const [activeTab, setActiveTab] = useState<"content" | "layout" | "branding" | "photo" | "ai">(
    "content"
  );
  const [copiedFbText, setCopiedFbText] = useState(false);

  const handleCopyFbText = () => {
    if (aiResult?.fbPostCaption) {
      navigator.clipboard.writeText(aiResult.fbPostCaption);
      setCopiedFbText(true);
      setTimeout(() => setCopiedFbText(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === "content"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Headline & Text</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("layout")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === "layout"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Style & Layout</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === "branding"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Branding</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("photo")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === "photo"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Photo Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === "ai"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>AI Newsroom</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-5 space-y-5">
        {/* --- TAB 1: CONTENT (Headline, Caption, Badge) --- */}
        {activeTab === "content" && (
          <div className="space-y-4">
            {/* Headline */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Headline Text
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => onChange({ headline: config.headline.toUpperCase() })}
                    className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    UPPERCASE
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={onGenerateAiEnhance}
                    disabled={isAiLoading}
                    className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>AI Rewriter</span>
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={config.headline}
                onChange={(e) => onChange({ headline: e.target.value })}
                placeholder="Enter bold news headline..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none leading-snug"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                <span>Recommended: 8–14 words for maximum Facebook engagement</span>
                <span>{config.headline.length} chars</span>
              </div>
            </div>

            {/* AI Headline Variations (if available) */}
            {aiResult?.headlines && (
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    AI Alternative Headlines
                  </span>
                  <span className="text-[10px] text-blue-600">Click to apply</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {Object.entries(aiResult.headlines).map(([type, hText]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onChange({ headline: hText })}
                      className="text-left px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-100/50 border border-blue-200/60 text-xs text-slate-800 transition flex items-start gap-2 group cursor-pointer"
                    >
                      <span className="text-[10px] uppercase font-bold text-blue-600 px-1 py-0.5 rounded bg-blue-50 shrink-0">
                        {type}
                      </span>
                      <span className="line-clamp-1 group-hover:text-blue-900">{hText}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Caption / Subtitle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Caption / Subhead
              </label>
              <textarea
                rows={2}
                value={config.caption}
                onChange={(e) => onChange({ caption: e.target.value })}
                placeholder="Short explanatory sentence or key takeaway..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none leading-relaxed"
              />
            </div>

            {/* Category Badge & Color */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Category Badge
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.badge}
                  onChange={(e) => onChange({ badge: e.target.value })}
                  placeholder="e.g. BREAKING NEWS"
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />

                {/* Badge color quick picker */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                  {BADGE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.name}
                      onClick={() => onChange({ badgeColor: c.value })}
                      className={`w-6 h-6 rounded-lg transition transform hover:scale-110 cursor-pointer ${
                        config.badgeColor === c.value
                          ? "ring-2 ring-slate-900 ring-offset-1 scale-105"
                          : ""
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>

              {/* Quick badge presets */}
              <div className="flex flex-wrap gap-1 pt-1">
                {BADGE_PRESETS.map((badge) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => onChange({ badge })}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition cursor-pointer border ${
                      config.badge === badge
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                    }`}
                  >
                    {badge}
                  </button>
                ))}
              </div>
            </div>

            {/* If quote template, show author attribution */}
            {config.template === "quote" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quote Speaker / Attribution
                </label>
                <input
                  type="text"
                  value={config.quoteAuthor || ""}
                  onChange={(e) => onChange({ quoteAuthor: e.target.value })}
                  placeholder="e.g. Dr. Jane Smith, Lead Astrophysicist"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}

            {/* Bottom Red Box (First Comment Link Callout) */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Bottom Red Callout Box
                  </label>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showCommentCallout}
                    onChange={(e) => onChange({ showCommentCallout: e.target.checked })}
                    className="w-3.5 h-3.5 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                  <span>Show on image</span>
                </label>
              </div>

              {config.showCommentCallout && (
                <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-red-950 uppercase tracking-wider">
                        Callout Message
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          onChange({ commentCalloutUppercase: !config.commentCalloutUppercase })
                        }
                        title="Toggle UPPERCASE vs Natural Case"
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                          config.commentCalloutUppercase
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {config.commentCalloutUppercase ? "ALL CAPS (ON)" : "NATURAL CASE"}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={config.commentCalloutText}
                      onChange={(e) => onChange({ commentCalloutText: e.target.value })}
                      placeholder="for more details please check the link in first comment"
                      className="w-full px-3.5 py-2 bg-white border border-red-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>

                  {/* Quick message presets */}
                  <div>
                    <label className="block text-[10px] font-bold text-red-900 uppercase tracking-wider mb-1">
                      Quick Presets
                    </label>
                    <div className="flex flex-col gap-1">
                      {[
                        "for more details please check the link in first comment",
                        "👉 for more details please check the link in first comment",
                        "Full details & source link in first comment 👇",
                        "Read complete report — link pinned in comments 📌",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => onChange({ commentCalloutText: preset })}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] text-left font-medium transition cursor-pointer border truncate ${
                            config.commentCalloutText === preset
                              ? "bg-red-600 text-white border-red-600 font-bold"
                              : "bg-white hover:bg-red-100/60 text-red-950 border-red-200"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bar Box Style & Color */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-red-200/70">
                    <div>
                      <label className="block text-[10px] font-bold text-red-950 uppercase tracking-wider mb-1">
                        Box Style
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: "solid-bar", label: "Full Bar" },
                          { id: "rounded-pill", label: "Pill Box" },
                          { id: "banner-tag", label: "Tag Box" },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => onChange({ commentCalloutStyle: st.id as any })}
                            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition cursor-pointer text-center ${
                              (config.commentCalloutStyle || "solid-bar") === st.id
                                ? "bg-red-600 text-white border-red-600"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-red-950 uppercase tracking-wider mb-1">
                        Box Color
                      </label>
                      <div className="flex items-center gap-1.5 p-1 bg-white border border-red-200 rounded-lg justify-between">
                        {[
                          { name: "News Red", value: "#DC2626" },
                          { name: "Vibrant Red", value: "#EF4444" },
                          { name: "Dark Ruby", value: "#991B1B" },
                          { name: "Rose Crimson", value: "#E11D48" },
                          { name: "Charcoal", value: "#0F172A" },
                        ].map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            title={c.name}
                            onClick={() => onChange({ commentCalloutBg: c.value })}
                            className={`w-6 h-6 rounded-md transition transform hover:scale-110 cursor-pointer ${
                              (config.commentCalloutBg || "#DC2626") === c.value
                                ? "ring-2 ring-slate-900 ring-offset-1 scale-110"
                                : ""
                            }`}
                            style={{ backgroundColor: c.value }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 2: LAYOUT & TEMPLATES --- */}
        {activeTab === "layout" && (
          <div className="space-y-5">
            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Facebook Format / Aspect Ratio
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((item) => {
                  const isSelected = config.aspectRatio === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onChange({ aspectRatio: item.id })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{item.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.ratio}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{item.bestFor}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                News Card Template
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TEMPLATES.map((tmpl) => {
                  const isSelected = config.template === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => onChange({ template: tmpl.id })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{tmpl.icon}</span>
                        <span className="text-xs font-bold text-slate-900">{tmpl.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 leading-tight">
                        {tmpl.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Typography */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Headline Font Family
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: "sans", label: "Sans", font: "font-sans" },
                      { id: "serif", label: "Serif", font: "font-serif" },
                      { id: "impact", label: "Impact", font: "font-mono font-bold" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onChange({ fontFamily: f.id as FontFamily })}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                        config.fontFamily === f.id
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      } ${f.font}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Headline Size
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["sm", "md", "lg", "xl"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onChange({ headlineSize: s })}
                      className={`py-2 rounded-xl text-xs font-bold uppercase border transition cursor-pointer text-center ${
                        config.headlineSize === s
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dark Overlay Opacity */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider">
                  Text Backdrop Darkening
                </span>
                <span className="font-mono text-slate-500">{config.overlayOpacity}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={config.overlayOpacity}
                onChange={(e) => onChange({ overlayOpacity: Number(e.target.value) })}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* --- TAB 3: BRANDING & SOURCE --- */}
        {activeTab === "branding" && (
          <div className="space-y-4">
            {/* Brand Logo Control Block */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-xs">
                    🏷️
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Brand Logo
                    </label>
                    <div className="text-[10px] text-slate-500">Position on generated news graphic</div>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showLogo}
                    onChange={(e) => onChange({ showLogo: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span>Show Logo</span>
                </label>
              </div>

              {config.showLogo && (
                <div className="space-y-3 pt-2 border-t border-slate-200/80">
                  {/* Current Logo Thumbnail & Presets */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-[#1a0204] border border-amber-300/40 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-slate-400">No logo</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              logoUrl: DEFAULT_SLSPORTS_LOGO_URL,
                              publisherName: "SLsports Sri Lanka",
                              publisherHandle: "@slsports_lk",
                              watermarkText: "www.slsports.com",
                              logoPosition: "bottom-left",
                              showLogo: true,
                            })
                          }
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/60 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>🇱🇰</span> Set SLSports Profile & Logo
                        </button>
                        <label className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>Upload Custom</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === "string") {
                                    onChange({ logoUrl: reader.result, showLogo: true });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {config.logoUrl === DEFAULT_SLSPORTS_LOGO_URL
                          ? "SLSports Sri Lanka gold & crimson crest"
                          : "Custom uploaded logo image"}
                      </div>
                    </div>
                  </div>

                  {/* Position selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Placement
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: "bottom-left", label: "Below Left ⭐", desc: "Default & Recommended" },
                        { id: "top-left", label: "Top Left", desc: "Above title" },
                        { id: "top-right", label: "Top Right", desc: "Opposite corner" },
                        { id: "bottom-right", label: "Bottom Right", desc: "Watermark side" },
                      ].map((pos) => {
                        const isSelected = (config.logoPosition || "bottom-left") === pos.id;
                        return (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => onChange({ logoPosition: pos.id as any })}
                            className={`px-2 py-1.5 rounded-lg border text-center transition cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 border-blue-600 text-blue-800 font-bold"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 font-medium"
                            }`}
                          >
                            <div className="text-[11px]">{pos.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Size selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Logo Size
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "sm", label: "Small (Compact)" },
                        { id: "md", label: "Medium (Standard)" },
                        { id: "lg", label: "Large (Prominent)" },
                      ].map((sz) => {
                        const isSelected = (config.logoSize || "md") === sz.id;
                        return (
                          <button
                            key={sz.id}
                            type="button"
                            onClick={() => onChange({ logoSize: sz.id as any })}
                            className={`py-1 px-2 rounded-lg border text-xs transition cursor-pointer ${
                              isSelected
                                ? "bg-slate-900 text-white border-slate-900 font-semibold"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {sz.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Publisher / Brand Name
                </label>
                <input
                  type="text"
                  value={config.publisherName}
                  onChange={(e) => onChange({ publisherName: e.target.value })}
                  placeholder="e.g. BBC News or MyPage"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Page Handle (optional)
                </label>
                <input
                  type="text"
                  value={config.publisherHandle}
                  onChange={(e) => onChange({ publisherHandle: e.target.value })}
                  placeholder="e.g. @technews"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Verified Badge Checkbox */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="checkbox"
                checked={config.isVerified}
                onChange={(e) => onChange({ isVerified: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Show Facebook Verified Tick</div>
                  <div className="text-[11px] text-slate-500">
                    Adds official blue badge icon next to publisher name
                  </div>
                </div>
              </div>
            </label>

            {/* Date / Timestamp */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Timestamp / Date Tag
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showDate}
                    onChange={(e) => onChange({ showDate: e.target.checked })}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                  />
                  <span>Display on image</span>
                </label>
              </div>
              <input
                type="text"
                value={config.customDate}
                onChange={(e) => onChange({ customDate: e.target.value })}
                placeholder="e.g. Just now, 2h ago, or March 18, 2026"
                disabled={!config.showDate}
                className="w-full px-3.5 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Watermark / Website Tag */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Corner Watermark
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showWatermark}
                    onChange={(e) => onChange({ showWatermark: e.target.checked })}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                  />
                  <span>Show watermark</span>
                </label>
              </div>
              <input
                type="text"
                value={config.watermarkText}
                onChange={(e) => onChange({ watermarkText: e.target.value })}
                placeholder="e.g. www.yourdomain.com"
                disabled={!config.showWatermark}
                className="w-full px-3.5 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* --- TAB 4: PHOTO ADJUSTMENTS --- */}
        {activeTab === "photo" && (
          <div className="space-y-4">
            {/* Photo Filters */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Color Grade & Filter
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "none", label: "Original" },
                    { id: "cinematic", label: "Cinematic" },
                    { id: "contrast", label: "High Contrast" },
                    { id: "dim", label: "Darkened" },
                    { id: "warm", label: "Warm News" },
                    { id: "monochrome", label: "B&W Dramatic" },
                  ] as const
                ).map((filt) => (
                  <button
                    key={filt.id}
                    type="button"
                    onClick={() => onChange({ imageFilter: filt.id as ImageFilter })}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                      config.imageFilter === filt.id
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {filt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Zoom */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
                  Image Scale / Zoom
                </span>
                <span className="font-mono text-slate-500">{config.imageZoom}%</span>
              </div>
              <input
                type="range"
                min="100"
                max="180"
                value={config.imageZoom}
                onChange={(e) => onChange({ imageZoom: Number(e.target.value) })}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Vertical Pan */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <MoveVertical className="w-3.5 h-3.5 text-slate-400" />
                  Vertical Position (Pan)
                </span>
                <span className="font-mono text-slate-500">{config.imageOffsetY}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={config.imageOffsetY}
                onChange={(e) => onChange({ imageOffsetY: Number(e.target.value) })}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Pan Up</span>
                <span>Center</span>
                <span>Pan Down</span>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 5: AI NEWSROOM --- */}
        {activeTab === "ai" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  AI News Editor
                </h3>
                <p className="text-[11px] text-slate-500">
                  Generate viral headlines and ready-to-post Facebook caption text
                </p>
              </div>

              <button
                type="button"
                onClick={onGenerateAiEnhance}
                disabled={isAiLoading}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {isAiLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </>
                )}
              </button>
            </div>

            {aiResult ? (
              <div className="space-y-4">
                {/* Facebook Post Copy */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Facebook Post Text (Ready to Publish)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyFbText}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      {copiedFbText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Post</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {aiResult.fbPostCaption}
                  </div>
                </div>

                {/* AI Headline Variations */}
                <div>
                  <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Alternative Headline Styles
                  </span>
                  <div className="space-y-2">
                    {Object.entries(aiResult.headlines).map(([style, text]) => (
                      <div
                        key={style}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-2"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            {style}
                          </span>
                          <p className="text-xs font-semibold text-slate-900 mt-1">{text}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onChange({ headline: text })}
                          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white text-[11px] font-medium text-slate-700 transition cursor-pointer shrink-0"
                        >
                          Use
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">
                  Ready to optimize for Facebook
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Click below to generate high-engagement headline variants, category tags, and a complete Facebook post caption.
                </p>
                <button
                  type="button"
                  onClick={onGenerateAiEnhance}
                  disabled={isAiLoading}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Generate Facebook AI Kit</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

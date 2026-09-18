import React from "react";
import { Newspaper, Sparkles, RefreshCw, Globe } from "lucide-react";
import { SAMPLE_ARTICLES } from "../data/sampleArticles";
import { ArticleData } from "../types";

interface HeaderProps {
  onSelectSample: (article: ArticleData) => void;
  onReset: () => void;
  hasArticle: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectSample,
  onReset,
  hasArticle,
}) => {
  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                SLSports Card Studio
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                slsportscard
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Generate branded SLSports Sri Lanka news cards & viral Facebook graphics
            </p>
          </div>
        </div>

        {/* Quick Demo selector & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Samples Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer border border-slate-200/80"
              title="Try with a sample article"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sample Articles</span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 hidden group-hover:block z-40">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Click to load sample
              </div>
              {SAMPLE_ARTICLES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSample(sample.data)}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition text-xs font-medium text-slate-800 flex items-center justify-between group/item cursor-pointer"
                >
                  <span className="truncate pr-2">{sample.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover/item:bg-blue-100 group-hover/item:text-blue-700">
                    {sample.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {hasArticle && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Start with another URL"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


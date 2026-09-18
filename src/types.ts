export type AspectRatio = "1:1" | "1.91:1" | "4:5" | "9:16";

export type NewsTemplate =
  | "breaking"
  | "editorial"
  | "split"
  | "quote"
  | "magazine"
  | "viral";

export type FontFamily = "sans" | "serif" | "impact";

export type ImageFilter = "none" | "cinematic" | "dim" | "contrast" | "warm" | "monochrome";

export interface ArticleData {
  url: string;
  domain: string;
  title: string;
  originalTitle?: string;
  description: string;
  featuredImage: string | null;
  candidateImages: string[];
  siteName: string;
  author?: string;
  publishedTime?: string;
  favicon?: string;
}

export interface NewsConfig {
  headline: string;
  caption: string;
  badge: string;
  badgeColor: string;
  publisherName: string;
  publisherHandle: string;
  isVerified: boolean;
  showDate: boolean;
  customDate: string;
  fontFamily: FontFamily;
  headlineSize: "sm" | "md" | "lg" | "xl";
  overlayOpacity: number; // 0 to 100
  imageZoom: number; // 100 to 200
  imageOffsetY: number; // -50 to 50
  imageFilter: ImageFilter;
  aspectRatio: AspectRatio;
  template: NewsTemplate;
  showWatermark: boolean;
  watermarkText: string;
  activeImageUrl: string;
  quoteAuthor?: string;
  showCommentCallout: boolean;
  commentCalloutText: string;
  commentCalloutBg: string;
  commentCalloutUppercase?: boolean;
  commentCalloutStyle?: "solid-bar" | "rounded-pill" | "banner-tag";
  showLogo: boolean;
  logoUrl: string;
  logoPosition: "bottom-left" | "top-left" | "top-right" | "bottom-right";
  logoSize: "sm" | "md" | "lg";
}

export interface AiEnhanceResult {
  headlines: {
    punchy: string;
    breaking: string;
    question: string;
    formal: string;
  };
  badge: string;
  caption: string;
  fbPostCaption: string;
}

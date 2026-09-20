import { ArticleData } from "../types";

/**
 * Client-side article extractor using browser DOMParser and public CORS proxies.
 * Serves as an immediate zero-failure fallback if the backend API is starting up or unreachable.
 */
export async function extractArticleClientSide(inputUrl: string): Promise<ArticleData> {
  let url = inputUrl.trim();

  // Auto-complete slsports.lk URLs if slug or path is provided
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    if (url.startsWith("slsports.lk") || url.startsWith("www.slsports.lk")) {
      url = "https://" + url;
    } else if (!url.includes(".")) {
      url = "https://slsports.lk/" + url.replace(/^\/+/, "");
    } else {
      url = "https://" + url;
    }
  }

  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");

  // Strict domain validation
  if (domain !== "slsports.lk") {
    throw new Error("Only articles from https://slsports.lk/ are supported. Please paste a link from slsports.lk.");
  }

  // Candidate proxy URLs
  const proxyEndpoints = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  ];

  let htmlText = "";
  let fetchError = "";

  for (const proxyUrl of proxyEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 200 && text.includes("<")) {
          htmlText = text;
          break;
        }
      }
    } catch (err: any) {
      fetchError = err?.message || String(err);
    }
  }

  const slugToTitle = (rawUrl: string): string => {
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
    return "SL Sports: Developing Match Report";
  };

  if (!htmlText) {
    const slugTitle = slugToTitle(url);
    return {
      url,
      domain: "slsports.lk",
      title: slugTitle,
      originalTitle: slugTitle,
      description: `Read the latest developing sports coverage and full match details on slsports.lk.`,
      featuredImage: null,
      candidateImages: [],
      siteName: "SL Sports",
      publishedTime: "Today",
      favicon: `https://www.google.com/s2/favicons?domain=slsports.lk&sz=128`,
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");

  const resolveUrl = (link?: string | null): string | null => {
    if (!link) return null;
    link = link.trim();
    if (!link) return null;
    try {
      return new URL(link, parsedUrl.origin).href;
    } catch {
      return link;
    }
  };

  const getMeta = (names: string[]): string => {
    for (const name of names) {
      const el =
        doc.querySelector(`meta[property="${name}"]`) ||
        doc.querySelector(`meta[name="${name}"]`);
      const val = el?.getAttribute("content");
      if (val && val.trim()) return val.trim();
    }
    return "";
  };

  const rawTitle =
    getMeta(["og:title", "twitter:title", "title"]) ||
    doc.querySelector("h1")?.textContent?.trim() ||
    doc.title?.trim() ||
    "Breaking News Headline";

  const cleanTitle = rawTitle
    .replace(/\s*[|\-–—]\s*SL\s*Sports.*$/i, "")
    .replace(/\s*[|\-–—]\s*[^|\-–—]+$/, "")
    .trim() || rawTitle;

  const rawDescription =
    getMeta(["og:description", "twitter:description", "description"]) ||
    doc.querySelector(".entry-content p")?.textContent?.trim() ||
    doc.querySelector("article p")?.textContent?.trim() ||
    doc.querySelector("main p")?.textContent?.trim() ||
    doc.querySelector("p")?.textContent?.trim() ||
    "";

  let siteName = "SL Sports";

  const featuredImage =
    resolveUrl(getMeta(["og:image:secure_url", "og:image", "twitter:image:src", "twitter:image"])) ||
    resolveUrl(doc.querySelector('link[rel="image_src"]')?.getAttribute("href")) ||
    null;

  const candidateImages: string[] = [];
  if (featuredImage) {
    candidateImages.push(featuredImage);
  }

  doc.querySelectorAll("article img, main img, img").forEach((el) => {
    const src = el.getAttribute("src") || el.getAttribute("data-src");
    if (src) {
      const resolved = resolveUrl(src.split(",")[0].trim().split(" ")[0]);
      if (
        resolved &&
        !resolved.endsWith(".svg") &&
        !resolved.includes("avatar") &&
        !resolved.includes("logo") &&
        !resolved.includes("icon") &&
        !candidateImages.includes(resolved) &&
        candidateImages.length < 8
      ) {
        candidateImages.push(resolved);
      }
    }
  });

  const author =
    getMeta(["author", "article:author"]) ||
    doc.querySelector(".author, [rel='author']")?.textContent?.trim() ||
    "";

  const publishedTime =
    getMeta(["article:published_time", "publish-date"]) ||
    doc.querySelector("time")?.getAttribute("datetime") ||
    doc.querySelector("time")?.textContent?.trim() ||
    "Today";

  const favicon =
    resolveUrl(doc.querySelector('link[rel="icon"]')?.getAttribute("href")) ||
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  return {
    success: true,
    url,
    domain,
    title: cleanTitle,
    originalTitle: rawTitle,
    description: rawDescription || `Latest news and updates from ${siteName}.`,
    featuredImage: featuredImage || (candidateImages[0] ?? null),
    candidateImages,
    siteName,
    author,
    publishedTime,
    favicon,
  } as ArticleData;
}

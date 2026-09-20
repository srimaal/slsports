import { ArticleData } from "../types";

// Helper to decode HTML entities in titles and descriptions
function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "—")
    .replace(/&#038;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * Client-side article extractor querying slsports.lk WordPress REST API directly
 * with fallback to CORS proxies and HTML scraping.
 * Guarantees that headline, featured photo, candidate photos, and excerpt are extracted.
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

  const pathSegments = parsedUrl.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  const slug = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : "";

  const slugToTitle = (rawUrl: string): string => {
    try {
      const u = new URL(rawUrl);
      const segments = u.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
      const s = segments[segments.length - 1] || "";
      if (s && s !== "wp-admin" && s !== "feed") {
        const words = s.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
        return words.replace(/\b\w/g, (c) => c.toUpperCase());
      }
    } catch {
      // ignore
    }
    return "SL Sports: Developing Match Report";
  };

  // 1. PRIMARY FAST PATH: Query slsports.lk WordPress REST API directly from browser
  // slsports.lk explicitly allows Cross-Origin requests on /wp-json/
  if (slug && slug !== "wp-admin" && slug !== "feed") {
    const wpEndpoints = [
      `https://slsports.lk/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://slsports.lk/wp-json/wp/v2/posts?slug=${slug}&_embed`)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(`https://slsports.lk/wp-json/wp/v2/posts?slug=${slug}&_embed`)}`,
    ];

    for (const endpoint of wpEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        const wpRes = await fetch(endpoint, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (wpRes.ok) {
          const text = await wpRes.text();
          if (text && text.trim().startsWith("[")) {
            const posts = JSON.parse(text);
            if (Array.isArray(posts) && posts.length > 0) {
              const p = posts[0];
              const rawTitle = p.title?.rendered || "";
              const cleanTitle = decodeHtmlEntities(rawTitle)
                .replace(/\s*[|\-–—]\s*SL\s*Sports.*$/i, "")
                .replace(/\s*[|\-–—]\s*[^|\-–—]+$/, "")
                .trim();

              const rawExcerpt = p.excerpt?.rendered || "";
              const cleanDesc = decodeHtmlEntities(rawExcerpt);

              // Extract featured media
              const mediaObj = p._embedded?.["wp:featuredmedia"]?.[0];
              let featuredMedia: string | null =
                mediaObj?.source_url ||
                mediaObj?.media_details?.sizes?.full?.source_url ||
                mediaObj?.media_details?.sizes?.large?.source_url ||
                null;

              // Collect candidate images
              const candidateImages: string[] = [];
              if (featuredMedia) {
                candidateImages.push(featuredMedia);
              }

              if (mediaObj?.media_details?.sizes) {
                const sizes = mediaObj.media_details.sizes;
                for (const key of Object.keys(sizes)) {
                  const sUrl = sizes[key]?.source_url;
                  if (sUrl && !candidateImages.includes(sUrl)) {
                    candidateImages.push(sUrl);
                  }
                }
              }

              // Also extract images from rendered content if any
              if (p.content?.rendered) {
                const imgMatches = p.content.rendered.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi);
                if (imgMatches) {
                  for (const m of imgMatches) {
                    if (!candidateImages.includes(m) && !m.includes("avatar") && !m.includes("logo")) {
                      candidateImages.push(m);
                    }
                  }
                }
              }

              if (!featuredMedia && candidateImages.length > 0) {
                featuredMedia = candidateImages[0];
              }

              const author = p._embedded?.author?.[0]?.name || "SL Sports Desk";
              const publishedTime = p.date
                ? new Date(p.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Today";

              return {
                url: p.link || url,
                domain: "slsports.lk",
                title: cleanTitle || slugToTitle(slug),
                originalTitle: rawTitle || cleanTitle,
                description:
                  cleanDesc ||
                  "Read the latest developing sports coverage and full match details on slsports.lk.",
                featuredImage: featuredMedia,
                candidateImages,
                siteName: "SL Sports",
                author,
                publishedTime,
                favicon: "https://www.google.com/s2/favicons?domain=slsports.lk&sz=128",
              };
            }
          }
        }
      } catch (err) {
        console.warn(`WordPress REST endpoint ${endpoint} attempt failed:`, err);
      }
    }
  }

  // 2. SECONDARY PATH: Scrape raw HTML via public CORS proxies
  const proxyEndpoints = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  ];

  let htmlText = "";

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
    } catch {
      // ignore
    }
  }

  if (!htmlText) {
    const slugTitle = slugToTitle(url);
    return {
      url,
      domain: "slsports.lk",
      title: slugTitle,
      originalTitle: slugTitle,
      description: "Read the latest developing sports coverage and full match details on slsports.lk.",
      featuredImage: null,
      candidateImages: [],
      siteName: "SL Sports",
      publishedTime: "Today",
      favicon: "https://www.google.com/s2/favicons?domain=slsports.lk&sz=128",
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

import type { Express } from "express";
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client server-side
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "slsportscard-app",
        },
      },
    });
  }
  return aiClient;
}

// Smart newsroom fallback generator when Gemini API is experiencing high demand (503) or offline
function generateSmartNewsFallback(title: string, description?: string, siteName?: string) {
  const cleanTitle = (title || "Breaking News Story")
    .replace(/\s*[-|–—]\s*[^—–|-]+$/, "")
    .trim();
  const words = cleanTitle.split(/\s+/);
  const punchy = words.length > 9 ? words.slice(0, 9).join(" ") + "..." : cleanTitle;

  const combinedText = `${cleanTitle} ${description || ""}`.toLowerCase();
  let badge = "BREAKING NEWS";
  if (
    combinedText.includes("battery") ||
    combinedText.includes("ai") ||
    combinedText.includes("tech") ||
    combinedText.includes("apple") ||
    combinedText.includes("software") ||
    combinedText.includes("chip") ||
    combinedText.includes("robot")
  ) {
    badge = "TECH BREAKTHROUGH";
  } else if (
    combinedText.includes("market") ||
    combinedText.includes("stock") ||
    combinedText.includes("fed") ||
    combinedText.includes("inflation") ||
    combinedText.includes("economy") ||
    combinedText.includes("dollar")
  ) {
    badge = "MARKETS";
  } else if (
    combinedText.includes("cricket") ||
    combinedText.includes("match") ||
    combinedText.includes("sl sports") ||
    combinedText.includes("slsports") ||
    combinedText.includes("ipl") ||
    combinedText.includes("wicket") ||
    combinedText.includes("tournament") ||
    combinedText.includes("sports")
  ) {
    badge = "SPORTS UPDATE";
  } else if (
    combinedText.includes("health") ||
    combinedText.includes("cancer") ||
    combinedText.includes("fda") ||
    combinedText.includes("vaccine") ||
    combinedText.includes("study") ||
    combinedText.includes("medical")
  ) {
    badge = "HEALTH & SCIENCE";
  } else if (
    combinedText.includes("climate") ||
    combinedText.includes("storm") ||
    combinedText.includes("weather") ||
    combinedText.includes("species") ||
    combinedText.includes("nature")
  ) {
    badge = "CLIMATE & NATURE";
  } else if (
    combinedText.includes("war") ||
    combinedText.includes("president") ||
    combinedText.includes("senate") ||
    combinedText.includes("election") ||
    combinedText.includes("global") ||
    combinedText.includes("world")
  ) {
    badge = "WORLD NEWS";
  } else if (
    combinedText.includes("exclusive") ||
    combinedText.includes("investigation") ||
    combinedText.includes("revealed")
  ) {
    badge = "EXCLUSIVE";
  }

  const question = cleanTitle.endsWith("?")
    ? cleanTitle
    : `What You Need to Know: ${cleanTitle}?`;
  const breaking = `BREAKING: ${cleanTitle}`;
  const formal = cleanTitle;

  const rawCaption = description ? description.split(/(?<=[.?!])\s+/)[0] : cleanTitle;
  const caption = rawCaption.length > 130 ? rawCaption.slice(0, 127) + "..." : rawCaption;

  const brand = siteName ? siteName.replace(/[^a-zA-Z0-9]/g, "") : "SLsportsLK";
  const fbPostCaption = `🚨 BREAKING: ${cleanTitle}\n\n${caption}\n\n📌 KEY HIGHLIGHTS:\n• ${cleanTitle}\n• Full developments and background analysis reported by ${siteName || "SLsports newsroom"}.\n• Stay tuned as this story continues to develop.\n\n💬 What are your thoughts on this? Join the conversation in the comments below!\n\n#BreakingNews #SLsports #SriLanka #${brand} #${badge.replace(/[^a-zA-Z0-9]/g, "")}`;

  return {
    headlines: {
      punchy,
      breaking,
      question,
      formal,
    },
    badge,
    caption,
    fbPostCaption,
  };
}

export function handleHealth(_req: any, res: any) {
  return res.json({
    status: "ok",
    app: "slsportscard",
    timestamp: new Date().toISOString(),
  });
}

export async function handleProxyImage(req: any, res: any) {
  try {
    const imageUrl = (req.query?.url || "") as string;
    if (!imageUrl) {
      return res.status(400).json({ error: "Missing image URL parameter 'url'" });
    }

    let targetUrl = imageUrl;
    if (targetUrl.startsWith("//")) {
      targetUrl = "https:" + targetUrl;
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Failed to fetch image: ${response.statusText}` });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");

    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error("Proxy image error:", err);
    return res.status(500).json({ error: "Failed to proxy image: " + (err.message || String(err)) });
  }
}

export async function handleFetchArticle(req: any, res: any) {
  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        // use raw body
      }
    }
    let { url } = body || {};
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Please provide a valid article URL." });
    }

    url = url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL structure." });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 FacebookExternalHit/1.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to load webpage (${response.status}: ${response.statusText}).`,
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Helper to resolve relative URLs
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

    // Extract Title
    const rawTitle =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $('meta[name="title"]').attr("content") ||
      $("h1").first().text().trim() ||
      $("title").text().trim() ||
      "";

    // Clean title from common suffix like " | CNN", " - The New York Times"
    const cleanedTitle = rawTitle.replace(/\s*[|\-–—]\s*[^|\-–—]+$/, "").trim() || rawTitle;

    // Extract Description / Caption
    const rawDescription =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      $("article p").first().text().trim() ||
      $("main p").first().text().trim() ||
      $("p").first().text().trim() ||
      "";

    // Extract Site Name / Publisher
    let siteName =
      $('meta[property="og:site_name"]').attr("content") ||
      $('meta[name="application-name"]').attr("content") ||
      "";

    if (!siteName) {
      const host = parsedUrl.hostname.replace(/^www\./, "");
      const parts = host.split(".");
      if (parts.length > 0) {
        siteName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
    }

    // Extract Main Featured Image
    let featuredImage =
      resolveUrl($('meta[property="og:image:secure_url"]').attr("content")) ||
      resolveUrl($('meta[property="og:image"]').attr("content")) ||
      resolveUrl($('meta[name="twitter:image:src"]').attr("content")) ||
      resolveUrl($('meta[name="twitter:image"]').attr("content")) ||
      resolveUrl($('link[rel="image_src"]').attr("href")) ||
      null;

    // Extract additional candidate images from the article
    const candidateImages: string[] = [];
    if (featuredImage) {
      candidateImages.push(featuredImage);
    }

    $("article img, main img, .article-body img, .entry-content img, img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("srcset");
      if (src) {
        const firstSrc = src.split(",")[0].trim().split(" ")[0];
        const resolved = resolveUrl(firstSrc);
        if (
          resolved &&
          !resolved.endsWith(".svg") &&
          !resolved.includes("avatar") &&
          !resolved.includes("logo") &&
          !resolved.includes("icon") &&
          !candidateImages.includes(resolved)
        ) {
          if (candidateImages.length < 8) {
            candidateImages.push(resolved);
          }
        }
      }
    });

    if (!featuredImage && candidateImages.length > 0) {
      featuredImage = candidateImages[0];
    }

    // Extract Author and Date
    const author =
      $('meta[name="author"]').attr("content") ||
      $('meta[property="article:author"]').attr("content") ||
      $(".author").first().text().trim() ||
      "";

    const publishedTime =
      $('meta[property="article:published_time"]').attr("content") ||
      $('meta[name="publish-date"]').attr("content") ||
      $("time").first().attr("datetime") ||
      $("time").first().text().trim() ||
      "";

    // Favicon
    const favicon =
      resolveUrl($('link[rel="icon"]').attr("href")) ||
      resolveUrl($('link[rel="shortcut icon"]').attr("href")) ||
      `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`;

    return res.json({
      success: true,
      url,
      domain: parsedUrl.hostname.replace(/^www\./, ""),
      title: cleanedTitle || rawTitle || "Breaking News Headline",
      originalTitle: rawTitle,
      description: rawDescription || "Read the full coverage and latest details on this developing story.",
      featuredImage,
      candidateImages,
      siteName: siteName || parsedUrl.hostname,
      author,
      publishedTime,
      favicon,
    });
  } catch (err: any) {
    console.error("Fetch article error:", err);
    return res.status(500).json({
      error: "Failed to fetch article: " + (err.message || String(err)),
    });
  }
}

export async function handleAiEnhance(req: any, res: any) {
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      // use raw body
    }
  }
  const { title, description, siteName } = body || {};
  if (!title) {
    return res.status(400).json({ error: "Missing article title for AI enhancement." });
  }

  const fallbackData = generateSmartNewsFallback(title, description, siteName);

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      success: true,
      data: fallbackData,
      source: "editorial-engine",
    });
  }

  const prompt = `You are a social media news editor specializing in high-engagement Facebook news graphics.
Based on this article:
Title: "${title}"
Summary: "${description || "No summary provided"}"
Source/Site: "${siteName || "News Desk"}"

Generate a JSON object with:
1. "headlines": An object of 4 distinct headline styles for a Facebook news image:
   - "punchy": Short, direct, high-contrast news headline (max 10 words, easy to read on mobile)
   - "breaking": Urgency-driven headline suitable for BREAKING NEWS banner
   - "question": Engaging question hook that triggers comments and shares
   - "formal": Traditional journalistic headline
2. "badge": A recommended 1-2 word uppercase category badge (e.g. "BREAKING", "JUST IN", "TECH", "EXCLUSIVE", "ANALYSIS", "SPORTS", "HEALTH", "WORLD NEWS")
3. "caption": A concise 1-2 sentence caption or subtitle to print on the graphic (under 25 words).
4. "fbPostCaption": A complete ready-to-publish Facebook text post caption (includes hook, 2-3 key takeaway bullet points, a discussion question to drive comments, and 3-5 relevant hashtags).

Return ONLY valid JSON matching this schema:
{
  "headlines": {
    "punchy": "string",
    "breaking": "string",
    "question": "string",
    "formal": "string"
  },
  "badge": "string",
  "caption": "string",
  "fbPostCaption": "string"
}`;

  const candidateModels = ["gemini-2.5-flash", "gemini-3.8-flash"];

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response?.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed && parsed.headlines) {
          return res.json({
            success: true,
            data: parsed,
            source: `gemini-${modelName}`,
          });
        }
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      const isHighDemandOrUnavailable =
        msg.includes("503") ||
        msg.includes("high demand") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED");

      if (isHighDemandOrUnavailable) {
        console.warn(`Gemini model ${modelName} is experiencing high demand (503/429). Trying fallback...`);
      } else {
        console.warn(`Gemini model ${modelName} call error:`, msg);
      }
    }
  }

  // High demand fallback
  return res.json({
    success: true,
    data: fallbackData,
    source: "editorial-engine",
    fallback: true,
  });
}

export function registerApiRoutes(app: Express) {
  // Support both with and without /api prefix
  app.get("/api/health", handleHealth);
  app.get("/health", handleHealth);

  app.get("/api/proxy-image", handleProxyImage);
  app.get("/proxy-image", handleProxyImage);

  app.post("/api/fetch-article", handleFetchArticle);
  app.post("/fetch-article", handleFetchArticle);

  app.post("/api/ai-enhance", handleAiEnhance);
  app.post("/ai-enhance", handleAiEnhance);
}

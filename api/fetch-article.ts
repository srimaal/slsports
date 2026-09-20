// Helper to decode HTML entities
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

function slugToTitle(slug: string): string {
  if (!slug) return "SL Sports News Update";
  const clean = slug
    .replace(/^https?:\/\/[^/]+\//i, "")
    .replace(/\/+$/, "")
    .split("/")
    .pop()!
    .replace(/[?#].*$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "SL Sports News Update";
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      // use raw body
    }
  }

  let url = (body?.url || req.query?.url || "") as string;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Please provide a valid slsports.lk article URL." });
  }

  url = url.trim();

  // Auto-complete slsports.lk URLs
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    if (url.startsWith("slsports.lk") || url.startsWith("www.slsports.lk")) {
      url = "https://" + url;
    } else if (!url.includes(".")) {
      url = "https://slsports.lk/" + url.replace(/^\/+/, "");
    } else {
      url = "https://" + url;
    }
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL structure." });
  }

  const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "slsports.lk") {
    return res.status(400).json({
      error: "Access restricted: This studio only fetches articles from https://slsports.lk/.",
    });
  }

  const pathSegments = parsedUrl.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  const slug = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : "";

  // 1. FAST WP REST API LOOKUP
  if (slug && slug !== "wp-admin" && slug !== "feed") {
    try {
      const wpRes = await fetch(
        `https://slsports.lk/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(5000),
        }
      );

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

            const mediaObj = p._embedded?.["wp:featuredmedia"]?.[0];
            let featuredMedia: string | null =
              mediaObj?.source_url ||
              mediaObj?.media_details?.sizes?.full?.source_url ||
              mediaObj?.media_details?.sizes?.large?.source_url ||
              null;

            const candidateImages: string[] = [];
            if (featuredMedia) {
              candidateImages.push(featuredMedia);
            }

            if (mediaObj?.media_details?.sizes) {
              const sizes = mediaObj.media_details.sizes;
              for (const k of Object.keys(sizes)) {
                const sUrl = sizes[k]?.source_url;
                if (sUrl && !candidateImages.includes(sUrl)) {
                  candidateImages.push(sUrl);
                }
              }
            }

            if (!featuredMedia && candidateImages.length > 0) {
              featuredMedia = candidateImages[0];
            }

            // Fallback image if post has no media
            const finalImage = featuredMedia || "https://slsports.lk/wp-content/uploads/2026/09/asa-2026-09-18.jpg";

            return res.status(200).json({
              success: true,
              url: p.link || url,
              domain: "slsports.lk",
              title: cleanTitle || slugToTitle(slug),
              originalTitle: rawTitle || cleanTitle,
              description: cleanDesc || "Read the latest developing sports coverage and full match details on slsports.lk.",
              featuredImage: finalImage,
              candidateImages: candidateImages.length > 0 ? candidateImages : [finalImage],
              siteName: "SL Sports",
              author: p._embedded?.author?.[0]?.name || "SL Sports Desk",
              publishedTime: p.date
                ? new Date(p.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Today",
              favicon: "https://www.google.com/s2/favicons?domain=slsports.lk&sz=128",
            });
          }
        }
      }
    } catch (wpErr) {
      console.warn("WP REST lookup warning:", wpErr);
    }
  }

  // 2. HTML SCRAPE FALLBACK
  try {
    const htmlRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 FacebookExternalHit/1.1",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (htmlRes.ok) {
      const html = await htmlRes.text();

      const getMetaContent = (prop: string) => {
        const match =
          html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i")) ||
          html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
        return match ? match[1] : null;
      };

      const rawTitle =
        getMetaContent("og:title") ||
        getMetaContent("twitter:title") ||
        (html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]) ||
        (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]) ||
        slugToTitle(slug);

      const cleanTitle = decodeHtmlEntities(rawTitle)
        .replace(/\s*[|\-–—]\s*SL\s*Sports.*$/i, "")
        .replace(/\s*[|\-–—]\s*[^|\-–—]+$/, "")
        .trim();

      const rawDesc =
        getMetaContent("og:description") ||
        getMetaContent("twitter:description") ||
        (html.match(/<p[^>]*>([^<]+)<\/p>/i)?.[1]) ||
        "";

      const cleanDesc = decodeHtmlEntities(rawDesc);

      const ogImage =
        getMetaContent("og:image:secure_url") ||
        getMetaContent("og:image") ||
        getMetaContent("twitter:image:src") ||
        getMetaContent("twitter:image");

      const candidateImages: string[] = [];
      if (ogImage) candidateImages.push(ogImage);

      const imgMatches = html.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi);
      if (imgMatches) {
        for (const m of imgMatches) {
          if (!candidateImages.includes(m) && !m.includes("avatar") && !m.includes("logo") && candidateImages.length < 8) {
            candidateImages.push(m);
          }
        }
      }

      const finalImage = ogImage || (candidateImages[0] || "https://slsports.lk/wp-content/uploads/2026/09/asa-2026-09-18.jpg");

      return res.status(200).json({
        success: true,
        url,
        domain: "slsports.lk",
        title: cleanTitle,
        originalTitle: rawTitle,
        description: cleanDesc || "Read the latest developing sports coverage and full match details on slsports.lk.",
        featuredImage: finalImage,
        candidateImages: candidateImages.length > 0 ? candidateImages : [finalImage],
        siteName: "SL Sports",
        author: "SL Sports Desk",
        publishedTime: "Today",
        favicon: "https://www.google.com/s2/favicons?domain=slsports.lk&sz=128",
      });
    }
  } catch (htmlErr) {
    console.warn("HTML scrape warning:", htmlErr);
  }

  // 3. ZERO-FAILURE FINAL SLUG FALLBACK
  const finalSlugTitle = slugToTitle(slug);
  const fallbackImg = "https://slsports.lk/wp-content/uploads/2026/09/asa-2026-09-18.jpg";
  return res.status(200).json({
    success: true,
    url,
    domain: "slsports.lk",
    title: finalSlugTitle,
    originalTitle: finalSlugTitle,
    description: "Read the latest developing sports coverage and full match details on slsports.lk.",
    featuredImage: fallbackImg,
    candidateImages: [fallbackImg],
    siteName: "SL Sports",
    author: "SL Sports Desk",
    publishedTime: "Today",
    favicon: "https://www.google.com/s2/favicons?domain=slsports.lk&sz=128",
  });
}

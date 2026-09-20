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
    .replace(/<[^>]+>/g, "")
    .trim();
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const response = await fetch("https://slsports.lk/wp-json/wp/v2/posts?_embed&per_page=12", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (response.ok) {
      const text = await response.text();
      if (text && text.trim().startsWith("[")) {
        const posts = JSON.parse(text);
        if (Array.isArray(posts) && posts.length > 0) {
          const articles = posts.map((p: any) => {
            const rawTitle = p.title?.rendered || "";
            const cleanTitle = decodeHtmlEntities(rawTitle)
              .replace(/\s*[|\-–—]\s*SL\s*Sports.*$/i, "")
              .trim();

            const rawExcerpt = p.excerpt?.rendered || "";
            const cleanDesc = decodeHtmlEntities(rawExcerpt);

            const mediaObj = p._embedded?.["wp:featuredmedia"]?.[0];
            const featuredMedia =
              mediaObj?.source_url ||
              mediaObj?.media_details?.sizes?.large?.source_url ||
              mediaObj?.media_details?.sizes?.full?.source_url ||
              "https://slsports.lk/wp-content/uploads/2026/09/asa-2026-09-18.jpg";

            return {
              id: p.id,
              url: p.link,
              title: cleanTitle,
              description: cleanDesc,
              featuredImage: featuredMedia,
              candidateImages: [featuredMedia],
              domain: "slsports.lk",
              siteName: "SL Sports",
              publishedTime: p.date
                ? new Date(p.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recent",
            };
          });

          return res.status(200).json({ success: true, articles });
        }
      }
    }
  } catch (err: any) {
    console.warn("slsports feed fetch warning:", err);
  }

  return res.status(200).json({ success: true, articles: [] });
}

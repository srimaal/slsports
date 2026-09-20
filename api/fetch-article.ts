import { handleFetchArticle } from "../server/apiRouter";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    return await handleFetchArticle(req, res);
  } catch (err: any) {
    console.error("Vercel serverless fetch-article fallback error:", err);
    return res.status(200).json({
      success: true,
      url: req.body?.url || "https://slsports.lk/",
      domain: "slsports.lk",
      title: "SL Sports Coverage",
      originalTitle: "SL Sports Coverage",
      description: "Read the latest developing sports coverage on slsports.lk.",
      featuredImage: null,
      candidateImages: [],
      siteName: "SL Sports",
      author: "SL Sports Desk",
      publishedTime: "Today",
      favicon: "https://www.google.com/s2/favicons?domain=slsports.lk&sz=128",
    });
  }
}


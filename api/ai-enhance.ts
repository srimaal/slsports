import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return aiClient;
}

function generateSmartNewsFallback(title: string, description?: string, siteName?: string) {
  const cleanTitle = (title || "Breaking News Story")
    .replace(/\s*[-|–—]\s*[^—–|-]+$/, "")
    .trim();
  const words = cleanTitle.split(/\s+/);
  const punchy = words.length > 9 ? words.slice(0, 9).join(" ") + "..." : cleanTitle;

  const combinedText = `${cleanTitle} ${description || ""}`.toLowerCase();
  let badge = "BREAKING";
  if (
    combinedText.includes("cricket") ||
    combinedText.includes("runs") ||
    combinedText.includes("wickets") ||
    combinedText.includes("match") ||
    combinedText.includes("ipl") ||
    combinedText.includes("cup")
  ) {
    badge = "CRICKET";
  } else if (
    combinedText.includes("athletics") ||
    combinedText.includes("games") ||
    combinedText.includes("olympic")
  ) {
    badge = "ATHLETICS";
  } else if (combinedText.includes("football") || combinedText.includes("fifa")) {
    badge = "FOOTBALL";
  }

  const caption = description
    ? description.length > 110
      ? description.slice(0, 107) + "..."
      : description
    : "Follow all the action and full match breakdown exclusively on slsports.lk.";

  return {
    headlines: {
      punchy,
      breaking: cleanTitle.toUpperCase(),
      question: `Can Anyone Stop This? ${cleanTitle}`,
      formal: `${cleanTitle}: Key Highlights and Developing Match Report`,
    },
    badge,
    caption,
    fbPostCaption: `🔥 LATEST UPDATE from ${siteName || "SL Sports"}!\n\n📌 ${cleanTitle}\n\n${description || "Full match coverage and in-depth reactions on slsports.lk."}\n\n👉 What are your thoughts on this performance? Drop your comments below!\n\n#SLSports #SriLankaSports #BreakingNews #MatchReport`,
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
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

  const { title, description, siteName } = body || {};
  if (!title) {
    return res.status(400).json({ error: "Missing article title for AI enhancement." });
  }

  const fallbackData = generateSmartNewsFallback(title, description, siteName);
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(200).json({
      success: true,
      data: fallbackData,
      source: "editorial-engine",
    });
  }

  const prompt = `You are a social media news editor specializing in high-engagement Facebook news graphics.
Based on this article:
Title: "${title}"
Summary: "${description || "No summary provided"}"
Source/Site: "${siteName || "SL Sports"}"

Generate a JSON object with:
1. "headlines": An object of 4 distinct headline styles:
   - "punchy": Short, direct, high-contrast news headline (max 10 words, easy to read on mobile)
   - "breaking": Urgency-driven headline suitable for BREAKING NEWS banner
   - "question": Engaging question hook that triggers comments and shares
   - "formal": Traditional journalistic headline
2. "badge": A recommended 1-2 word uppercase category badge (e.g. "BREAKING", "CRICKET", "MATCH REPORT", "EXCLUSIVE", "ANALYSIS")
3. "caption": A concise 1-2 sentence caption or subtitle to print on the graphic (under 25 words).
4. "fbPostCaption": A complete ready-to-publish Facebook text post caption (includes hook, 2-3 key takeaway bullet points, a discussion question, and 3-5 relevant hashtags).

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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response?.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed && parsed.headlines) {
        return res.status(200).json({
          success: true,
          data: parsed,
          source: "gemini-3.8-flash",
        });
      }
    }
  } catch (err) {
    console.warn("Gemini generation error, using smart fallback:", err);
  }

  return res.status(200).json({
    success: true,
    data: fallbackData,
    source: "editorial-engine",
    fallback: true,
  });
}

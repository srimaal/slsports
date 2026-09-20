export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const imageUrl = (req.query?.url || "") as string;
  if (!imageUrl) {
    return res.status(400).json({ error: "Missing image URL parameter 'url'" });
  }

  let targetUrl = imageUrl;
  if (targetUrl.startsWith("//")) {
    targetUrl = "https:" + targetUrl;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      // Fallback: redirect to high-availability CDN proxy with open CORS
      return res.redirect(302, `https://images.weserv.nl/?url=${encodeURIComponent(targetUrl)}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");

    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error("Proxy image error:", err);
    return res.redirect(302, `https://images.weserv.nl/?url=${encodeURIComponent(targetUrl)}`);
  }
}

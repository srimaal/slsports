import { NewsConfig, AspectRatio } from "../types";

export interface Dimensions {
  width: number;
  height: number;
}

export function getCanvasDimensions(aspect: AspectRatio): Dimensions {
  switch (aspect) {
    case "1:1":
      return { width: 1200, height: 1200 };
    case "1.91:1":
      return { width: 1200, height: 628 };
    case "4:5":
      return { width: 1080, height: 1350 };
    case "9:16":
      return { width: 1080, height: 1920 };
    default:
      return { width: 1200, height: 1200 };
  }
}

// Helper to wrap text into lines fitting maxWidth
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + " " + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

// Load image safely via proxy or data URI
export function loadSafeImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    // If it's an external HTTP URL, route through proxy to prevent canvas CORS taint
    let loadUrl = src;
    if (src.startsWith("http://") || src.startsWith("https://")) {
      loadUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
    }

    img.onload = () => resolve(img);
    img.onerror = () => {
      // If proxy failed, try loading directly with crossOrigin
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = "anonymous";
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = (e) => reject(e);
      fallbackImg.src = src;
    };
    img.src = loadUrl;
  });
}

export async function renderNewsCardToCanvas(
  canvas: HTMLCanvasElement,
  config: NewsConfig
): Promise<void> {
  const { width, height } = getCanvasDimensions(config.aspectRatio);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Background fallback
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, width, height);

  // 1. Draw Background / Main Article Image
  if (config.activeImageUrl) {
    try {
      const img = await loadSafeImage(config.activeImageUrl);

      // Save context for filters/transforms
      ctx.save();

      // Apply image filters
      switch (config.imageFilter) {
        case "cinematic":
          ctx.filter = "contrast(115%) saturate(120%) brightness(95%)";
          break;
        case "contrast":
          ctx.filter = "contrast(135%) brightness(90%)";
          break;
        case "dim":
          ctx.filter = "brightness(75%)";
          break;
        case "warm":
          ctx.filter = "sepia(25%) saturate(130%)";
          break;
        case "monochrome":
          ctx.filter = "grayscale(100%) contrast(120%)";
          break;
        default:
          ctx.filter = "none";
      }

      const zoom = (config.imageZoom || 100) / 100;
      const offsetY = ((config.imageOffsetY || 0) / 100) * height * 0.5;

      // Handle template specific image areas
      let drawAreaHeight = height;
      if (config.template === "split") {
        drawAreaHeight = height * 0.58;
      }

      // Calculate object-fit: cover
      const imgRatio = img.width / img.height;
      const targetRatio = width / drawAreaHeight;
      let renderW = width * zoom;
      let renderH = drawAreaHeight * zoom;

      if (imgRatio > targetRatio) {
        renderH = drawAreaHeight * zoom;
        renderW = renderH * imgRatio;
      } else {
        renderW = width * zoom;
        renderH = renderW / imgRatio;
      }

      const renderX = (width - renderW) / 2;
      const renderY = (drawAreaHeight - renderH) / 2 + offsetY;

      // Clip for split template
      if (config.template === "split") {
        ctx.beginPath();
        ctx.rect(0, 0, width, drawAreaHeight);
        ctx.clip();
      }

      ctx.drawImage(img, renderX, renderY, renderW, renderH);
      ctx.restore();
    } catch (e) {
      console.warn("Could not load article image for canvas, using fallback pattern", e);
      // Modern geometric news background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#1e293b");
      grad.addColorStop(1, "#090d16");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // 2. Render Template Layouts
  switch (config.template) {
    case "breaking":
      renderBreakingTemplate(ctx, width, height, config);
      break;
    case "split":
      renderSplitTemplate(ctx, width, height, config);
      break;
    case "editorial":
      renderEditorialTemplate(ctx, width, height, config);
      break;
    case "quote":
      renderQuoteTemplate(ctx, width, height, config);
      break;
    case "magazine":
      renderMagazineTemplate(ctx, width, height, config);
      break;
    case "viral":
      renderViralTemplate(ctx, width, height, config);
      break;
    default:
      renderEditorialTemplate(ctx, width, height, config);
  }

  // 3. Render Bottom Red Comment Box if enabled
  if (config.showCommentCallout && config.commentCalloutText) {
    renderCommentCalloutBox(ctx, width, height, config);
  }

  // 4. Render Brand Logo if enabled (e.g. Below Left)
  if (config.showLogo && config.logoUrl) {
    try {
      const logoImg = await loadSafeImage(config.logoUrl);
      renderBrandLogo(ctx, width, height, logoImg, config);
    } catch (err) {
      console.warn("Could not load brand logo on canvas:", err);
    }
  }

  // 5. Optional watermark / bottom brand
  if (config.showWatermark && config.watermarkText) {
    const calloutH = (config.showCommentCallout && config.commentCalloutText)
      ? getCalloutBarHeight(height, config.aspectRatio, config.commentCalloutStyle)
      : 0;
    ctx.save();
    ctx.font = "600 24px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.textAlign = "right";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(config.watermarkText, width - 40, height - 35 - calloutH);
    ctx.restore();
  }
}

function getTemplateFooterHeight(
  height: number,
  config: NewsConfig,
  baseFooterH: number = 80
): number {
  const calloutOffset = (config.showCommentCallout && config.commentCalloutText)
    ? getCalloutBarHeight(height, config.aspectRatio, config.commentCalloutStyle)
    : 0;
  const hasBottomLeftLogo = config.showLogo && (config.logoPosition === "bottom-left" || !config.logoPosition);
  const scale = Math.max(0.7, height / 1200);
  const logoSize = getLogoPixelSize(config.logoSize || "md", scale);
  const extraLogoH = hasBottomLeftLogo ? Math.max(0, logoSize - Math.round(52 * scale)) : 0;
  return baseFooterH + calloutOffset + extraLogoH;
}

// --- TEMPLATE 1: BREAKING NEWS BANNER ---
function renderBreakingTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: NewsConfig
) {
  // Vignette overlay
  const overlay = ctx.createLinearGradient(0, height * 0.3, 0, height);
  const userAlpha = (config.overlayOpacity ?? 85) / 100;
  overlay.addColorStop(0, "rgba(10, 15, 29, 0)");
  overlay.addColorStop(0.55, `rgba(10, 15, 29, ${userAlpha * 0.85})`);
  overlay.addColorStop(1, `rgba(10, 15, 29, ${Math.min(1, userAlpha * 1.1)})`);
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, width, height);

  // Top or upper BREAKING NEWS Bar
  const barY = 40;
  const barH = 68;
  const barW = width - 80;

  // Red accent bar
  ctx.fillStyle = config.badgeColor || "#DC2626";
  ctx.fillRect(40, barY, barW, barH);

  // Top Bar Content
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 32px 'Oswald', 'Plus Jakarta Sans', sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(`⚡ ${config.badge.toUpperCase() || "BREAKING NEWS"}`, 65, barY + barH / 2);

  // Source on right side of bar
  ctx.font = "700 22px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(config.publisherName || "NEWS DESK", width - 65, barY + barH / 2);

  // Headline Typography
  const paddingX = 60;
  const contentWidth = width - paddingX * 2;
  const fontChoice = getFontFamilyString(config.fontFamily);
  const headlinePx = getHeadlinePixelSize(config.headlineSize, height);

  ctx.font = `800 ${headlinePx}px ${fontChoice}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  const headlineLines = wrapText(ctx, config.headline, contentWidth);
  const lineHeight = headlinePx * 1.22;
  const totalHeadlineH = headlineLines.length * lineHeight;

  // Caption lines
  ctx.font = "500 30px 'Plus Jakarta Sans', sans-serif";
  ctx.shadowBlur = 6;
  const captionLines = config.caption ? wrapText(ctx, config.caption, contentWidth) : [];
  const captionLineH = 42;
  const totalCaptionH = captionLines.length * captionLineH;

  // Footer bar height
  const footerH = getTemplateFooterHeight(height, config, 80);
  const startY = height - footerH - totalCaptionH - (totalCaptionH ? 30 : 0) - totalHeadlineH - 50;

  // Draw Headline lines
  ctx.font = `800 ${headlinePx}px ${fontChoice}`;
  ctx.fillStyle = "#FFFFFF";
  headlineLines.forEach((line, idx) => {
    ctx.fillText(line, paddingX, startY + idx * lineHeight);
  });

  // Draw Caption lines
  if (captionLines.length > 0) {
    ctx.font = "500 28px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    const capStartY = startY + totalHeadlineH + 24;
    captionLines.forEach((line, idx) => {
      ctx.fillText(line, paddingX, capStartY + idx * captionLineH);
    });
  }

  // Footer bar with Live indicator & publisher details
  renderFooterBar(ctx, width, height, config, paddingX);
}

// --- TEMPLATE 2: EDITORIAL (MODERN CINEMATIC) ---
function renderEditorialTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: NewsConfig
) {
  // Dramatic smooth bottom gradient
  const grad = ctx.createLinearGradient(0, height * 0.25, 0, height);
  const alpha = (config.overlayOpacity ?? 80) / 100;
  grad.addColorStop(0, "rgba(15, 23, 42, 0)");
  grad.addColorStop(0.4, `rgba(15, 23, 42, ${alpha * 0.7})`);
  grad.addColorStop(0.85, `rgba(15, 23, 42, ${alpha})`);
  grad.addColorStop(1, `rgba(15, 23, 42, ${Math.min(1, alpha * 1.15)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const paddingX = 70;
  const contentWidth = width - paddingX * 2;
  const fontChoice = getFontFamilyString(config.fontFamily);
  const headlinePx = getHeadlinePixelSize(config.headlineSize, height);

  // Badge pill
  const badgeText = (config.badge || "SPECIAL REPORT").toUpperCase();
  ctx.font = "800 22px 'Plus Jakarta Sans', sans-serif";
  const badgeMetrics = ctx.measureText(badgeText);
  const badgeW = badgeMetrics.width + 36;
  const badgeH = 44;

  ctx.font = `800 ${headlinePx}px ${fontChoice}`;
  const headlineLines = wrapText(ctx, config.headline, contentWidth);
  const lineHeight = headlinePx * 1.25;
  const totalHeadlineH = headlineLines.length * lineHeight;

  ctx.font = "500 28px 'Plus Jakarta Sans', sans-serif";
  const captionLines = config.caption ? wrapText(ctx, config.caption, contentWidth) : [];
  const captionLineH = 40;
  const totalCaptionH = captionLines.length * captionLineH;

  const footerH = getTemplateFooterHeight(height, config, 90);
  const startY = height - footerH - totalCaptionH - (totalCaptionH ? 26 : 0) - totalHeadlineH - badgeH - 30;

  // Draw Pill
  ctx.save();
  ctx.fillStyle = config.badgeColor || "#2563EB";
  ctx.beginPath();
  ctx.roundRect(paddingX, startY, badgeW, badgeH, 8);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 20px 'Plus Jakarta Sans', sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(badgeText, paddingX + badgeW / 2, startY + badgeH / 2);
  ctx.restore();

  // Headline
  ctx.save();
  ctx.font = `800 ${headlinePx}px ${fontChoice}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 10;
  const headlineStartY = startY + badgeH + 22;
  headlineLines.forEach((line, idx) => {
    ctx.fillText(line, paddingX, headlineStartY + idx * lineHeight);
  });
  ctx.restore();

  // Caption
  if (captionLines.length > 0) {
    ctx.save();
    ctx.font = "400 28px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "rgba(241, 245, 249, 0.9)";
    ctx.textBaseline = "top";
    const capStartY = headlineStartY + totalHeadlineH + 20;
    captionLines.forEach((line, idx) => {
      ctx.fillText(line, paddingX, capStartY + idx * captionLineH);
    });
    ctx.restore();
  }

  // Footer bar with verified badge
  renderFooterBar(ctx, width, height, config, paddingX);
}

// --- TEMPLATE 3: SPLIT SLATE (TOP PHOTO / LOWER SLATE) ---
function renderSplitTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: NewsConfig
) {
  const slateTop = height * 0.54;
  const slateH = height - slateTop;

  // Draw slate background
  ctx.save();
  ctx.fillStyle = "#0B1120"; // Deep solid slate
  ctx.fillRect(0, slateTop, width, slateH);

  // Colored top accent border on the slate
  ctx.fillStyle = config.badgeColor || "#E11D48";
  ctx.fillRect(0, slateTop, width, 8);
  ctx.restore();

  const paddingX = 64;
  const contentWidth = width - paddingX * 2;
  const fontChoice = getFontFamilyString(config.fontFamily);
  const headlinePx = Math.min(getHeadlinePixelSize(config.headlineSize, height), 62);

  // Source & Badge row
  const metaY = slateTop + 40;
  ctx.save();
  ctx.fillStyle = config.badgeColor || "#E11D48";
  ctx.font = "800 22px 'Plus Jakarta Sans', sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(config.badge.toUpperCase() || "NEWS DESK", paddingX, metaY);

  if (config.customDate && config.showDate) {
    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 20px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(config.customDate, width - paddingX, metaY);
  }
  ctx.restore();

  // Headline
  ctx.save();
  ctx.font = `800 ${headlinePx}px ${fontChoice}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  const headlineLines = wrapText(ctx, config.headline, contentWidth);
  const lineHeight = headlinePx * 1.25;
  const headY = metaY + 32;

  // Take at most 3-4 lines
  headlineLines.slice(0, 3).forEach((line, idx) => {
    ctx.fillText(line, paddingX, headY + idx * lineHeight);
  });
  ctx.restore();

  // Caption
  const headTotalH = Math.min(headlineLines.length, 3) * lineHeight;
  if (config.caption) {
    ctx.save();
    ctx.font = "400 26px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#CBD5E1";
    ctx.textBaseline = "top";
    const capLines = wrapText(ctx, config.caption, contentWidth);
    const capY = headY + headTotalH + 18;
    capLines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, paddingX, capY + idx * 38);
    });
    ctx.restore();
  }

  // Publisher at bottom of slate
  renderFooterBar(ctx, width, height, config, paddingX);
}

// --- TEMPLATE 4: QUOTE / STATEMENT CARD ---
function renderQuoteTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: NewsConfig
) {
  // Dark overlay
  ctx.fillStyle = "rgba(10, 15, 30, 0.84)";
  ctx.fillRect(0, 0, width, height);

  const paddingX = 80;
  const contentWidth = width - paddingX * 2;
  const fontChoice = getFontFamilyString("serif"); // Quotes shine with refined serif

  // Giant quotation mark
  ctx.save();
  ctx.fillStyle = config.badgeColor || "#38BDF8";
  ctx.font = "italic 800 160px 'Playfair Display', Georgia, serif";
  ctx.textBaseline = "top";
  ctx.fillText("“", paddingX - 15, 60);
  ctx.restore();

  // Category Pill
  const pillY = 160;
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.beginPath();
  ctx.roundRect(paddingX, pillY, 180, 42, 6);
  ctx.fill();
  ctx.fillStyle = "#F8FAFC";
  ctx.font = "800 18px 'Plus Jakarta Sans', sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText((config.badge || "STATEMENT").toUpperCase(), paddingX + 90, pillY + 21);
  ctx.restore();

  // Quote statement
  ctx.save();
  const quoteSize = Math.min(getHeadlinePixelSize(config.headlineSize, height), 64);
  ctx.font = `italic 700 ${quoteSize}px ${fontChoice}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "top";
  const quoteLines = wrapText(ctx, `“${config.headline}”`, contentWidth);
  const qLineH = quoteSize * 1.35;
  const qStartY = pillY + 70;

  quoteLines.forEach((line, idx) => {
    ctx.fillText(line, paddingX, qStartY + idx * qLineH);
  });
  ctx.restore();

  // Attribution / Caption
  const qTotalH = quoteLines.length * qLineH;
  if (config.caption) {
    ctx.save();
    ctx.font = "500 28px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = config.badgeColor || "#38BDF8";
    ctx.textBaseline = "top";
    const attrY = qStartY + qTotalH + 30;
    ctx.fillText(`— ${config.quoteAuthor || config.publisherName || "Official Statement"}`, paddingX, attrY);

    ctx.font = "400 24px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    const subLines = wrapText(ctx, config.caption, contentWidth);
    subLines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, paddingX, attrY + 45 + idx * 34);
    });
    ctx.restore();
  }

  renderFooterBar(ctx, width, height, config, paddingX);
}

// --- TEMPLATE 5: MINIMALIST MAGAZINE ---
function renderMagazineTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: NewsConfig
) {
  // Sophisticated bordered canvas with clean frame
  const frameBorder = 36;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(frameBorder, frameBorder, width - frameBorder * 2, height - frameBorder * 2);
  ctx.restore();

  // Gradient bottom
  const grad = ctx.createLinearGradient(0, height * 0.35, 0, height);
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(0.5, "rgba(0, 0, 0, 0.75)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.95)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const paddingX = 80;
  const contentWidth = width - paddingX * 2;
  const fontChoice = getFontFamilyString("serif");
  const headlinePx = getHeadlinePixelSize(config.headlineSize, height);

  // Top publication mark
  ctx.save();
  ctx.font = "800 24px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "4px";
  ctx.fillText((config.publisherName || "THE CHRONICLE").toUpperCase(), width / 2, 70);

  ctx.font = "600 16px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText(config.customDate || "EXCLUSIVE EDITION", width / 2, 105);
  ctx.restore();

  // Headline
  ctx.save();
  ctx.font = `700 ${headlinePx}px ${fontChoice}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const headlineLines = wrapText(ctx, config.headline, contentWidth);
  const lineHeight = headlinePx * 1.25;
  const totalHeadlineH = headlineLines.length * lineHeight;

  ctx.font = "400 26px 'Plus Jakarta Sans', sans-serif";
  const captionLines = config.caption ? wrapText(ctx, config.caption, contentWidth) : [];
  const capLineH = 38;
  const totalCapH = captionLines.length * capLineH;

  const calloutOffset = (config.showCommentCallout && config.commentCalloutText)
    ? getCalloutBarHeight(height, config.aspectRatio, config.commentCalloutStyle)
    : 0;
  const startY = height - 120 - calloutOffset - totalCapH - (totalCapH ? 24 : 0) - totalHeadlineH;

  // Category line above headline
  ctx.font = "800 20px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = config.badgeColor || "#EAB308";
  ctx.fillText(`— ${(config.badge || "FEATURE").toUpperCase()}`, paddingX, startY - 36);

  ctx.font = `700 ${headlinePx}px ${fontChoice}`;
  ctx.fillStyle = "#FFFFFF";
  headlineLines.forEach((line, idx) => {
    ctx.fillText(line, paddingX, startY + idx * lineHeight);
  });

  if (captionLines.length > 0) {
    ctx.font = "400 26px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    const cY = startY + totalHeadlineH + 20;
    captionLines.forEach((line, idx) => {
      ctx.fillText(line, paddingX, cY + idx * capLineH);
    });
  }
  ctx.restore();

  renderFooterBar(ctx, width, height, config, paddingX);
}

// --- TEMPLATE 6: VIRAL PUNCHLINE (HIGH IMPACT / BOLD BLOCKS) ---
function renderViralTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: NewsConfig
) {
  // Heavy contrast background
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "rgba(0, 0, 0, 0.35)");
  grad.addColorStop(0.5, "rgba(0, 0, 0, 0.75)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.95)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const paddingX = 60;
  const contentWidth = width - paddingX * 2;
  const fontChoice = getFontFamilyString("impact");
  const headlinePx = Math.min(getHeadlinePixelSize(config.headlineSize, height) * 1.05, 82);

  ctx.font = `800 ${headlinePx}px ${fontChoice}`;
  const headlineLines = wrapText(ctx, config.headline.toUpperCase(), contentWidth);
  const lineHeight = headlinePx * 1.15;
  const totalHeadlineH = headlineLines.length * lineHeight;

  const calloutOffset = (config.showCommentCallout && config.commentCalloutText)
    ? getCalloutBarHeight(height, config.aspectRatio, config.commentCalloutStyle)
    : 0;
  const startY = height - 160 - calloutOffset - totalHeadlineH - (config.caption ? 80 : 0);

  // Big Badge box
  const badgeText = (config.badge || "JUST IN").toUpperCase();
  ctx.save();
  ctx.font = "800 28px 'Oswald', sans-serif";
  const badgeW = ctx.measureText(badgeText).width + 40;
  ctx.fillStyle = "#E11D48";
  ctx.fillRect(paddingX, startY - 70, badgeW, 52);
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, paddingX + 20, startY - 70 + 26);
  ctx.restore();

  // Highlight block for each headline line (Facebook viral style)
  ctx.save();
  ctx.font = `800 ${headlinePx}px ${fontChoice}`;
  ctx.textBaseline = "top";

  headlineLines.forEach((line, idx) => {
    const y = startY + idx * lineHeight;
    const textW = ctx.measureText(line).width;

    // Yellow or Black box
    ctx.fillStyle = idx === 0 ? "#FACC15" : "#FFFFFF";
    ctx.fillRect(paddingX - 12, y - 6, textW + 24, lineHeight - 4);

    ctx.fillStyle = "#000000";
    ctx.fillText(line, paddingX, y);
  });
  ctx.restore();

  // Caption in clean pill or white text
  if (config.caption) {
    ctx.save();
    ctx.font = "600 28px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 8;
    const capY = startY + totalHeadlineH + 24;
    const capLines = wrapText(ctx, config.caption, contentWidth);
    capLines.slice(0, 2).forEach((l, i) => {
      ctx.fillText(l, paddingX, capY + i * 36);
    });
    ctx.restore();
  }

  renderFooterBar(ctx, width, height, config, paddingX);
}

// Shared Footer Bar (Publisher, Verified tick, Date)
function renderFooterBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: NewsConfig,
  paddingX: number
) {
  const calloutOffset = (config.showCommentCallout && config.commentCalloutText)
    ? getCalloutBarHeight(height, config.aspectRatio, config.commentCalloutStyle)
    : 0;
  const footerY = height - 52 - calloutOffset;

  const hasBottomLeftLogo = config.showLogo && (config.logoPosition === "bottom-left" || !config.logoPosition);
  const scale = Math.max(0.7, height / 1200);
  const logoSize = getLogoPixelSize(config.logoSize || "md", scale);
  const startX = hasBottomLeftLogo ? paddingX + logoSize + Math.round(18 * scale) : paddingX;

  ctx.save();
  // Thin separator divider
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX, footerY - 24);
  ctx.lineTo(width - paddingX, footerY - 24);
  ctx.stroke();

  // Publisher name
  ctx.font = "700 24px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  const pubName = config.publisherName || "News Desk";
  ctx.fillText(pubName, startX, footerY);

  let curX = startX + ctx.measureText(pubName).width + 10;

  // Blue verified badge checkmark
  if (config.isVerified) {
    drawVerifiedBadge(ctx, curX, footerY, 11);
    curX += 32;
  }

  // Handle
  if (config.publisherHandle) {
    ctx.font = "500 20px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText(config.publisherHandle, curX, footerY);
  }

  // Date on the right
  if (config.showDate && config.customDate) {
    ctx.font = "600 20px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.textAlign = "right";
    ctx.fillText(config.customDate, width - paddingX, footerY);
  }

  ctx.restore();
}

function drawVerifiedBadge(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
) {
  ctx.save();
  // Blue circle
  ctx.fillStyle = "#1877F2"; // Facebook Blue
  ctx.beginPath();
  ctx.arc(centerX + radius, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // White tick
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  const ox = centerX + radius;
  const oy = centerY;
  ctx.moveTo(ox - radius * 0.45, oy);
  ctx.lineTo(ox - radius * 0.1, oy + radius * 0.35);
  ctx.lineTo(ox + radius * 0.45, oy - radius * 0.35);
  ctx.stroke();
  ctx.restore();
}

function getFontFamilyString(family: NewsConfig["fontFamily"]): string {
  switch (family) {
    case "serif":
      return "'Playfair Display', Georgia, serif";
    case "impact":
      return "'Oswald', Impact, sans-serif";
    case "sans":
    default:
      return "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
  }
}

function getHeadlinePixelSize(
  size: NewsConfig["headlineSize"],
  canvasHeight: number
): number {
  const scale = canvasHeight / 1200;
  switch (size) {
    case "sm":
      return Math.round(44 * scale);
    case "md":
      return Math.round(54 * scale);
    case "lg":
      return Math.round(66 * scale);
    case "xl":
      return Math.round(78 * scale);
    default:
      return Math.round(56 * scale);
  }
}

export function getCalloutBarHeight(
  height: number,
  aspect: AspectRatio,
  style?: "solid-bar" | "rounded-pill" | "banner-tag"
): number {
  const baseH = aspect === "1.91:1" ? 48 : 58;
  const barH = Math.round(baseH * Math.max(0.85, Math.min(1.35, height / 1200)));
  if (style === "rounded-pill" || style === "banner-tag") {
    return barH + 20;
  }
  return barH;
}

export function renderCommentCalloutBox(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: NewsConfig
) {
  if (!config.showCommentCallout || !config.commentCalloutText) return;

  const bg = config.commentCalloutBg || "#DC2626";
  const scale = height / 1200;
  const baseH = config.aspectRatio === "1.91:1" ? 48 : 58;
  const barH = Math.round(baseH * Math.max(0.85, Math.min(1.35, scale)));
  const style = config.commentCalloutStyle || "solid-bar";

  const rawText = config.commentCalloutUppercase !== false
    ? config.commentCalloutText.toUpperCase()
    : config.commentCalloutText;

  ctx.save();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  if (style === "rounded-pill") {
    const marginX = Math.round(48 * (width / 1200));
    const boxW = width - marginX * 2;
    const boxY = height - barH - Math.round(16 * scale);
    const radius = Math.round(barH / 2);

    // Subtle drop shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(marginX, boxY, boxW, barH, radius);
    ctx.fill();

    // Top border highlight
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    drawCalloutText(ctx, marginX + boxW / 2, boxY + barH / 2, barH, boxW - 40, rawText, scale);
  } else if (style === "banner-tag") {
    const marginX = Math.round(36 * (width / 1200));
    const boxW = width - marginX * 2;
    const boxY = height - barH - Math.round(14 * scale);

    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(marginX, boxY, boxW, barH, 8);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    drawCalloutText(ctx, marginX + boxW / 2, boxY + barH / 2, barH, boxW - 36, rawText, scale);
  } else {
    // Solid full-width bottom bar running across the entire width
    const boxY = height - barH;

    // Solid red background
    ctx.fillStyle = bg;
    ctx.fillRect(0, boxY, width, barH);

    // Crisp top highlight stroke
    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    ctx.fillRect(0, boxY, width, Math.max(1.5, Math.round(2 * scale)));

    drawCalloutText(ctx, width / 2, boxY + barH / 2, barH, width - 40, rawText, scale);
  }

  ctx.restore();
}

function drawCalloutText(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  barH: number,
  maxW: number,
  text: string,
  scale: number
) {
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let fontSize = Math.max(16, Math.round(22 * Math.max(0.85, Math.min(1.3, scale))));
  ctx.font = `800 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;

  let textWidth = ctx.measureText(text).width;
  while (textWidth > maxW && fontSize > 13) {
    fontSize -= 1;
    ctx.font = `800 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
    textWidth = ctx.measureText(text).width;
  }

  // Text shadow for maximum legibility on Facebook feed
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;

  ctx.fillText(text, centerX, centerY);
  ctx.restore();
}

export function getLogoPixelSize(
  size: "sm" | "md" | "lg" = "md",
  scale: number
): number {
  switch (size) {
    case "sm":
      return Math.round(88 * scale);
    case "lg":
      return Math.round(155 * scale);
    case "md":
    default:
      return Math.round(118 * scale);
  }
}

export function renderBrandLogo(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  logoImg: HTMLImageElement,
  config: NewsConfig
) {
  if (!config.showLogo) return;

  const scale = Math.max(0.7, height / 1200);
  const size = getLogoPixelSize(config.logoSize || "md", scale);
  const calloutOffset = (config.showCommentCallout && config.commentCalloutText)
    ? getCalloutBarHeight(height, config.aspectRatio, config.commentCalloutStyle)
    : 0;
  const paddingX = Math.round(48 * (width / 1200));

  let x = paddingX;
  let y = height - calloutOffset - size - Math.round(14 * scale);

  switch (config.logoPosition) {
    case "top-left":
      x = paddingX;
      y = Math.round(36 * scale);
      break;
    case "top-right":
      x = width - paddingX - size;
      y = Math.round(36 * scale);
      break;
    case "bottom-right":
      x = width - paddingX - size;
      y = height - calloutOffset - size - Math.round(14 * scale);
      break;
    case "bottom-left":
    default:
      x = paddingX;
      y = height - calloutOffset - size - Math.round(14 * scale);
      break;
  }

  ctx.save();
  // Standout Drop Shadow for visual pop over any photo background
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = Math.round(16 * scale);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(4 * scale);

  const radius = Math.round(10 * scale);

  // Background backing
  ctx.fillStyle = "#1E0204";
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.fill();

  // Reset shadow for crisp image clipping
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.clip();

  // Draw logo image
  ctx.drawImage(logoImg, x, y, size, size);
  ctx.restore();

  // Subtle golden highlight border around the logo
  ctx.strokeStyle = "rgba(245, 218, 145, 0.85)";
  ctx.lineWidth = Math.max(1.5, Math.round(2 * scale));
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.stroke();

  ctx.restore();
}

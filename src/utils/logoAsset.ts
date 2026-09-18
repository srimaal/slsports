/**
 * Pre-rendered high-fidelity vector logo asset matching the user's uploaded SLsports logo:
 * Golden framed crimson box with central "S", "Sl sports SRI LANKA", and "www.slsports.com"
 */

export const SLSPORTS_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <!-- Outer Gold Frame Gradients -->
    <linearGradient id="goldOuter" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ECD489" />
      <stop offset="25%" stop-color="#B88A34" />
      <stop offset="50%" stop-color="#FDE8A5" />
      <stop offset="75%" stop-color="#8F6218" />
      <stop offset="100%" stop-color="#ECD489" />
    </linearGradient>

    <linearGradient id="goldInner" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#9C6B1B" />
      <stop offset="30%" stop-color="#FCE197" />
      <stop offset="60%" stop-color="#7A4E0D" />
      <stop offset="85%" stop-color="#F7D883" />
      <stop offset="100%" stop-color="#B2822B" />
    </linearGradient>

    <radialGradient id="bgCrimson" cx="50%" cy="46%" r="65%">
      <stop offset="0%" stop-color="#6B1017" />
      <stop offset="50%" stop-color="#4E080E" />
      <stop offset="100%" stop-color="#2C0407" />
    </radialGradient>

    <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#B3842E" />
      <stop offset="50%" stop-color="#FFEBB0" />
      <stop offset="100%" stop-color="#8A5A12" />
    </linearGradient>

    <linearGradient id="redSl" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FF3838" />
      <stop offset="100%" stop-color="#D60E18" />
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="bevel3d" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.8" />
    </filter>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.7" />
    </filter>
  </defs>

  <!-- Outermost Shadow -->
  <rect x="10" y="10" width="480" height="480" rx="14" fill="#140203" />

  <!-- Outer Beveled Gold Frame -->
  <rect x="12" y="12" width="476" height="476" rx="12" fill="url(#goldOuter)" stroke="#523508" stroke-width="2" />
  
  <!-- Inner Gold Ridge Line -->
  <rect x="22" y="22" width="456" height="456" rx="8" fill="none" stroke="url(#goldInner)" stroke-width="4" />
  <rect x="26" y="26" width="448" height="448" rx="6" fill="#1e0204" />

  <!-- Rich Crimson Textured Background Canvas -->
  <rect x="30" y="30" width="440" height="440" rx="4" fill="url(#bgCrimson)" />

  <!-- Subtle leather / textured grain pattern overlay -->
  <g opacity="0.07" fill="#ffffff">
    <circle cx="80" cy="80" r="1.5" /><circle cx="140" cy="90" r="1.2" /><circle cx="210" cy="75" r="1.5" />
    <circle cx="290" cy="85" r="1.3" /><circle cx="380" cy="70" r="1.5" /><circle cx="420" cy="110" r="1.2" />
    <circle cx="70" cy="150" r="1.3" /><circle cx="430" cy="190" r="1.4" /><circle cx="65" cy="270" r="1.5" />
    <circle cx="425" cy="310" r="1.3" /><circle cx="75" cy="380" r="1.4" /><circle cx="420" cy="410" r="1.5" />
  </g>

  <!-- Inner Gold Inset Box Frame -->
  <rect x="85" y="85" width="330" height="330" rx="8" fill="#580A10" stroke="url(#goldInner)" stroke-width="5" filter="url(#bevel3d)" />
  <rect x="91" y="91" width="318" height="318" rx="6" fill="none" stroke="#FFA726" stroke-opacity="0.3" stroke-width="1.5" />

  <!-- Large Central White Serif Letter 'S' with 3D Bevel/Shadow -->
  <!-- Shadow offset -->
  <text x="250" y="278" 
        font-family="'Playfair Display', 'Times New Roman', 'Georgia', serif" 
        font-size="205" 
        font-weight="900" 
        text-anchor="middle" 
        fill="#110203" 
        opacity="0.85">S</text>
  <!-- Foreground Crisp White S -->
  <text x="249" y="275" 
        font-family="'Playfair Display', 'Times New Roman', 'Georgia', serif" 
        font-size="205" 
        font-weight="900" 
        text-anchor="middle" 
        fill="#FFFFFF"
        filter="url(#softGlow)">S</text>

  <!-- Middle Banner: 'Sl sports SRI LANKA' -->
  <g transform="translate(98, 290)">
    <!-- Red 'Sl' with drop shadow -->
    <text x="2" y="52" 
          font-family="'Playfair Display', 'Times New Roman', 'Georgia', serif" 
          font-size="62" 
          font-weight="900" 
          fill="#160102" 
          opacity="0.9">Sl</text>
    <text x="0" y="50" 
          font-family="'Playfair Display', 'Times New Roman', 'Georgia', serif" 
          font-size="62" 
          font-weight="900" 
          fill="url(#redSl)"
          stroke="#5C0005"
          stroke-width="1"
          filter="url(#softGlow)">Sl</text>

    <!-- White 'sports' -->
    <text x="70" y="48" 
          font-family="'Playfair Display', 'Times New Roman', 'Georgia', serif" 
          font-size="47" 
          font-weight="700" 
          fill="#160102" 
          opacity="0.9">sports</text>
    <text x="69" y="46" 
          font-family="'Playfair Display', 'Times New Roman', 'Georgia', serif" 
          font-size="47" 
          font-weight="700" 
          fill="#FFFFFF"
          filter="url(#softGlow)">sports</text>

    <!-- 'SRI LANKA' subtitle aligned right under sports -->
    <text x="296" y="65" 
          font-family="'Plus Jakarta Sans', Arial, sans-serif" 
          font-size="14" 
          font-weight="800" 
          letter-spacing="2.5" 
          text-anchor="end" 
          fill="#FFFFFF"
          opacity="0.95">SRI LANKA</text>

    <!-- Thin divider line under brand name -->
    <line x1="0" y1="74" x2="304" y2="74" stroke="url(#goldLine)" stroke-width="1.8" />
  </g>

  <!-- Bottom Website Box: 'www.slsports.com' -->
  <g transform="translate(94, 372)">
    <!-- Thin white/gold underline bar for website -->
    <text x="156" y="24" 
          font-family="'Plus Jakarta Sans', Arial, sans-serif" 
          font-size="24.5" 
          font-weight="800" 
          letter-spacing="0.5" 
          text-anchor="middle" 
          fill="#160102"
          opacity="0.9">www.slsports.com</text>
    <text x="155" y="23" 
          font-family="'Plus Jakarta Sans', Arial, sans-serif" 
          font-size="24.5" 
          font-weight="800" 
          letter-spacing="0.5" 
          text-anchor="middle" 
          fill="#FFFFFF"
          filter="url(#softGlow)">www.slsports.com</text>
  </g>
</svg>`;

// Convert SVG string to data URL
export const DEFAULT_SLSPORTS_LOGO_URL = `data:image/svg+xml;utf8,${encodeURIComponent(SLSPORTS_LOGO_SVG)}`;

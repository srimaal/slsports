# Deploying SLSports Card to Vercel (`slsportscard.vercel.app`)

This project is pre-configured for 1-click deployment on [Vercel](https://vercel.com) with full support for:
- ⚡ **Vite React Frontend** (Static compilation into `dist/`)
- 🚀 **Serverless API Routes** (`/api/fetch-article`, `/api/ai-enhance`, `/api/proxy-image`, `/api/health` in `api/index.ts`)
- 🔒 **Zero-config Routing** configured in `vercel.json`

---

## 3-Step Deployment Guide to get `slsportscard.vercel.app`

### Step 1: Export or Push to GitHub
1. In Google AI Studio, click **Settings** (or Project Menu) at the top right.
2. Select **Export to GitHub** (or download the ZIP and push to a new GitHub repository).
3. Name your repository (e.g. `slsportscard`).

---

### Step 2: Create Project on Vercel
1. Go to [https://vercel.com/new](https://vercel.com/new) (sign in with GitHub).
2. Find your repository and click **Import**.
3. **Important for your custom URL:** Under **Project Name**, enter:
   ```text
   slsportscard
   ```
   *(Setting this project name automatically assigns `https://slsportscard.vercel.app` as your production domain)*.
4. The Framework Preset will automatically detect **Vite**.

---

### Step 3: Add Environment Variables & Deploy
1. Expand the **Environment Variables** section on Vercel.
2. Add your Gemini API key:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `your_gemini_api_key_here` (obtained from Google AI Studio)
3. Click **Deploy**.

Vercel will build the frontend, deploy the serverless API functions, and your application will be live at:
👉 **`https://slsportscard.vercel.app`**

---

## Custom Domains
If you wish to attach a custom domain (such as `cards.slsports.com` or `news.slsports.lk`):
1. In your Vercel Dashboard, go to **Project Settings > Domains**.
2. Click **Add Domain**, enter your custom domain, and point your DNS CNAME/A records as guided by Vercel.

# NEXT Intelligence - Deployment Guide

## 🚀 Complete Deployment Setup with Supabase

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Git installed
- Vercel/Netlify account (for frontend deployment)

---

## Part 1: Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **"New Project"**
3. Fill in:
   - **Project Name**: `next-intelligence`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Select closest to your users
4. Click **"Create new project"** (takes ~2 minutes)

### Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste it into the SQL editor
5. Click **"Run"** (bottom right)
6. You should see "Success. No rows returned"

### Step 3: Get API Keys

1. Go to **Settings** → **API** in Supabase dashboard
2. Copy these values:
   - **Project URL** (looks like: `https://xxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

---

## Part 2: Frontend Setup

### Step 1: Configure Environment Variables

Create `frontend/.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:8000
```

Replace with your actual Supabase URL and anon key from Step 3 above.

### Step 2: Install Dependencies

```powershell
cd frontend
npm install
```

### Step 3: Test Locally

```powershell
npm run dev
```

Open `http://localhost:5173` - you should see the landing page!

---

## Part 3: Backend Setup (Python FastAPI)

### Step 1: Configure Backend Environment

Create `backend/.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

**To get Service Role Key:**
1. Go to Supabase **Settings** → **API**
2. Find **service_role** key (⚠️ Keep this secret!)
3. Copy and paste into `.env`

**To get JWT Secret:**
1. Still in **Settings** → **API**
2. Scroll down to **JWT Settings**
3. Copy the **JWT Secret**

### Step 2: Install Python Dependencies

```powershell
cd backend
pip install -r requirements.txt
```

### Step 3: Test Backend

```powershell
uvicorn api.main:app --reload
```

Backend should run on `http://localhost:8000`

---

## Part 4: Deploy Frontend (Vercel)

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   ```
   VITE_SUPABASE_URL = your-supabase-url
   VITE_SUPABASE_ANON_KEY = your-anon-key
   VITE_API_URL = your-backend-url (add after backend deployment)
   ```
6. Click **"Deploy"**

### Option B: Deploy via CLI

```powershell
cd frontend
npm install -g vercel
vercel login
vercel
```

Follow prompts and add environment variables when asked.

---

## Part 5: Deploy Backend (Render/Railway)

### Option A: Railway (Recommended - Easy)

1. Go to [railway.app](https://railway.app) and sign up
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Configure:
   - **Root Directory**: `/backend`
   - **Start Command**: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables in Railway:
   ```
   SUPABASE_URL = your-supabase-url
   SUPABASE_KEY = your-service-role-key
   SUPABASE_JWT_SECRET = your-jwt-secret
   ```
6. Click **"Deploy"**
7. Copy your Railway URL (looks like: `https://your-app.up.railway.app`)

### Option B: Render

1. Go to [render.com](https://render.com) and sign up
2. Click **"New Web Service"**
3. Connect GitHub repository
4. Configure:
   - **Name**: `next-intelligence-backend`
   - **Region**: Same as Supabase
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables (same as Railway)
6. Click **"Create Web Service"**

---

## Part 6: Update Frontend with Backend URL

1. Go back to your Vercel deployment
2. Go to **Settings** → **Environment Variables**
3. Update `VITE_API_URL` with your Railway/Render URL
4. Click **"Redeploy"** in Deployments tab

---

## Part 7: Test Full Stack

### 1. Test Registration
- Go to your Vercel URL
- Click **"Get Started"**
- Fill registration form
- Should redirect to dashboard

### 2. Test Scan
- Create a new scan with paste URLs
- Should save to Supabase
- Check Supabase dashboard → **Table Editor** → `scans`

### 3. Test Search
- Go to Search page
- Search for keywords
- Should query Supabase `scan_results` table

### 4. Test Alerts
- Go to Alerts page
- Should display from `alerts` table

---

## 🎉 You're Live!

Your app is now fully deployed:
- **Frontend**: Vercel URL
- **Backend**: Railway/Render URL
- **Database**: Supabase

### Post-Deployment Checklist

✅ Test user registration/login
✅ Test scan creation
✅ Test search functionality
✅ Test alerts display
✅ Verify RLS policies working (users only see their own data)
✅ Check backend logs for errors

---

## Troubleshooting

### "Failed to connect to Supabase"
- Check environment variables are correct
- Verify Supabase project is not paused
- Check anon key is the **anon** key, not service_role

### "CORS Error"
- Add frontend URL to backend CORS origins
- In `backend/api/main.py`:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["https://your-frontend.vercel.app"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

### "Authentication Failed"
- Check JWT secret matches in Supabase and backend .env
- Verify user exists in Supabase Auth dashboard

### Backend not starting
- Check Python version (need 3.9+)
- Verify all environment variables are set
- Check logs in Railway/Render dashboard

---

## Cost Breakdown (All Free Tier)

- ✅ **Supabase**: 500MB database, 2GB bandwidth/month - FREE
- ✅ **Vercel**: Unlimited deployments, 100GB bandwidth - FREE
- ✅ **Railway**: 500 hours/month, $5 free credit - FREE (with verification)
- ✅ **Render**: 750 hours/month - FREE

**Total Monthly Cost: $0** 🎉

---

## Next Steps

1. **Custom Domain**: Add your domain in Vercel settings
2. **Email Auth**: Enable email templates in Supabase Auth
3. **Monitoring**: Set up Sentry for error tracking
4. **Analytics**: Add PostHog or Plausible
5. **Backups**: Enable automatic backups in Supabase (Pro plan)

---

## Support

If you encounter issues:
1. Check Supabase logs: **Logs Explorer**
2. Check backend logs: Railway/Render dashboard
3. Check browser console: F12 Developer Tools
4. Verify all environment variables are set correctly

Good luck! 🚀

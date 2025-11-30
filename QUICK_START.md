# 🚀 Quick Start Guide

Get your NEXT Intelligence app running in 5 minutes!

## Step 1: Install Dependencies

### Frontend
```powershell
cd frontend
npm install
```

### Backend
```powershell
cd backend
pip install -r requirements.txt
```

## Step 2: Set Up Supabase (5 minutes)

1. **Create account**: Go to [supabase.com](https://supabase.com) → Sign up → New Project
2. **Run schema**: Copy `supabase/schema.sql` → Supabase Dashboard → SQL Editor → Run
3. **Get credentials**: Settings → API → Copy Project URL and anon key

## Step 3: Configure Environment

### Frontend `.env`
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:8000
```

### Backend `.env`
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

## Step 4: Run Locally

### Terminal 1 - Backend
```powershell
cd backend
uvicorn api.main:app --reload
```

### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```

## Step 5: Test It!

1. Open `http://localhost:5173`
2. Click **"Get Started"** → Register
3. Create a scan → Watch results populate!

---

## 🎉 You're Running!

**Next Steps:**
- Deploy to production: See `DEPLOYMENT_GUIDE.md`
- Customize styling in `frontend/src/index.css`
- Add more scrapers in `backend/scrapers/`

**Need Help?**
- Frontend errors: Check browser console (F12)
- Backend errors: Check terminal with uvicorn running
- Database issues: Check Supabase Logs Explorer

---

## Common Issues

### "Failed to connect to Supabase"
✅ Check `.env` file has correct URL and key
✅ Verify Supabase project is not paused

### "Port already in use"
✅ Frontend: Change port in `vite.config.ts`
✅ Backend: Use `uvicorn api.main:app --port 8001`

### "Import errors"
✅ Run `npm install` again in frontend
✅ Run `pip install -r requirements.txt` again in backend

---

**Environment Files Checklist:**
- [ ] `frontend/.env` created with Supabase credentials
- [ ] `backend/.env` created with service role key
- [ ] Ran SQL schema in Supabase dashboard
- [ ] Both servers running (backend on :8000, frontend on :5173)

Happy scanning! 🔍

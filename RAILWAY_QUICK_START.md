# Railway Deployment - Quick Start Guide

Follow these steps to deploy your Django backend on Railway (5-10 minutes).

## Prerequisites

✅ Your code is pushed to GitHub  
✅ You have a GitHub account  
✅ You have (or will create) a database (PlanetScale recommended)

---

## Step 1: Sign up on Railway

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (easiest method)
4. Authorize Railway to access your repositories

---

## Step 2: Deploy from GitHub

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select your repository
4. Railway will automatically detect it's a Django project

---

## Step 3: Configure Service

1. Railway creates a service automatically
2. Go to **Settings** tab of the service
3. Set **Root Directory**: `databse/backend/django_backend`
4. The **Start Command** should be auto-detected as:
   ```
   gunicorn backend_django.wsgi:application
   ```
   (Railway handles the port automatically)

---

## Step 4: Set Up Database

### Option A: Use External Database (PlanetScale - Recommended)

1. Sign up at https://planetscale.com (free tier)
2. Create a new database
3. Copy the connection string from dashboard
4. Format: `mysql://user:password@host:port/database_name`

### Option B: Use Railway MySQL (if available)

1. In Railway project, click **"New"** → **"Database"** → **"Add MySQL"**
2. Railway creates database automatically
3. Get connection URL from database service settings

---

## Step 5: Add Environment Variables

Go to your Django service → **Variables** tab → Add these:

```
DJANGO_SECRET=<generate-this>
DJANGO_DEBUG=0
DATABASE_URL=<your-database-url-from-step-4>
ALLOWED_HOSTS=*.railway.app
```

### How to generate DJANGO_SECRET:

**Option 1:** Use online generator at https://djecrety.ir/

**Option 2:** Run in terminal:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Option 3:** Use any random long string (for testing only)

---

## Step 6: Deploy

1. After adding environment variables, Railway automatically deploys
2. Go to **Deployments** tab to see progress
3. Wait for deployment to complete (2-3 minutes)

---

## Step 7: Get Your URL

1. Go to **Settings** tab
2. Under **Networking**, you'll see your URL
3. Example: `https://your-app-production.up.railway.app`
4. Copy this URL - this is your API base URL!

---

## Step 8: Run Migrations

### Method 1: Railway Dashboard (Easiest)

1. Go to your Django service
2. Click **"Deployments"** tab
3. Click **"..."** on latest deployment → **"View Logs"**
4. Or use the terminal in Railway dashboard:
   - Click service → **"View Logs"**
   - Or use **"Run Command"** if available

### Method 2: Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migrations
railway run python manage.py migrate
```

---

## Step 9: Create Superuser

Use Railway CLI or dashboard terminal:

```bash
railway run python manage.py createsuperuser
```

Follow prompts to create admin user.

---

## Step 10: Test Your API

1. Visit: `https://your-app.railway.app/api/`
2. You should see API response or Django REST framework interface
3. Test other endpoints:
   - `/api/users/`
   - `/api/assets/`
   - etc.

---

## Step 11: Update Frontend

1. Go to your frontend deployment (Vercel, etc.)
2. Update environment variable:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-app.railway.app
   ```
3. Redeploy frontend

---

## Troubleshooting

### Issue: Deployment fails
- **Solution:** Check logs in Railway dashboard → Deployments → View logs
- Common issues: Missing environment variables, wrong root directory

### Issue: Database connection error
- **Solution:** Verify `DATABASE_URL` is correct format: `mysql://user:pass@host:port/dbname`
- Check database is accessible from Railway

### Issue: 502 Bad Gateway
- **Solution:** Ensure `gunicorn` is in `requirements.txt` (it is!)
- Check start command is correct

### Issue: Static files 404
- **Solution:** Add this to Railway deployment (if needed):
  ```
  python manage.py collectstatic --noinput
  ```

---

## Environment Variables Checklist

Make sure you have:
- ✅ `DJANGO_SECRET` - Generated secure key
- ✅ `DJANGO_DEBUG=0` - Production mode
- ✅ `DATABASE_URL` - Your MySQL connection string
- ✅ `ALLOWED_HOSTS=*.railway.app` - Allow Railway domain

---

## Next Steps

1. ✅ Backend deployed on Railway
2. ⬜ Set up database (PlanetScale)
3. ⬜ Deploy frontend on Vercel
4. ⬜ Test full application

---

**Your backend will be live at:** `https://your-app.railway.app`

*Need help? Check Railway logs or see main DEPLOYMENT_GUIDE.md*


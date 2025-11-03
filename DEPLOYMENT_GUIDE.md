# Deployment Guide - Asset Management System

This guide covers hosting and deploying your full-stack Asset Management System (Django backend + Next.js frontend + MySQL database).

## Table of Contents
1. [Overview](#overview)
2. [Database Hosting Options](#database-hosting-options)
3. [Backend Deployment (Django)](#backend-deployment-django)
4. [Frontend Deployment (Next.js)](#frontend-deployment-nextjs)
5. [Complete Deployment Examples](#complete-deployment-examples)
6. [Environment Variables](#environment-variables)

---

## Overview

Your application consists of three components:
- **MySQL Database** - Data storage
- **Django REST API** - Backend server (port 8000)
- **Next.js Frontend** - Client application (port 3000)

You can deploy all three components to the cloud, or keep the database on a managed service while deploying the applications separately.

---

## Database Hosting Options

### Option 1: Managed MySQL Services (Recommended)

**Best for:** Production deployments

#### A. **PlanetScale** (MySQL-compatible, free tier available)
- Free tier: 1 database, 1GB storage
- Serverless, auto-scaling
- URL format: `mysql://user:pass@host:port/dbname`

**Setup:**
1. Sign up at https://planetscale.com
2. Create a new database
3. Get connection string from dashboard
4. Use as `DATABASE_URL` in your Django settings

#### B. **Railway** (MySQL included, free tier)
- Free tier: $5 credit/month
- Easy PostgreSQL/MySQL setup
- URL provided in dashboard

#### C. **AWS RDS** (Production-grade, paid)
- Highly scalable
- Managed backups
- ~$15-50/month minimum

#### D. **DigitalOcean Managed Databases**
- Simple pricing
- $15/month for basic MySQL
- Good performance

#### E. **Aiven** (Free tier available)
- MySQL, PostgreSQL options
- Free trial with credits

### Option 2: Self-Hosted MySQL
- Deploy MySQL on a VPS (DigitalOcean, Linode, Vultr)
- Requires manual setup and maintenance
- More control, but you handle backups/updates

---

## Backend Deployment (Django)

> 💡 **Looking for the EASIEST free options?** See `FREE_BACKEND_OPTIONS.md` for a detailed comparison of the simplest free hosting platforms!

### Option 1: **Railway** ⭐ EASIEST - Recommended for Starters

Railway can host your Django app with automatic deployments from GitHub.

**Steps:**
1. Push your code to GitHub
2. Sign up at https://railway.app
3. Create new project → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables:
   ```
   DJANGO_SECRET=<your-secret-key>
   DJANGO_DEBUG=0
   DATABASE_URL=<your-database-url>
   ALLOWED_HOSTS=<your-app-url.railway.app>
   ```
6. Railway auto-detects Django and deploys
7. Your API will be live at `https://your-app.railway.app`

**Note:** Install `gunicorn` in requirements.txt for production:
```txt
gunicorn>=21.0
```

Update your `requirements.txt` to include production dependencies.

---

### Option 2: **PythonAnywhere** ⭐ VERY EASY - Great for Learning

**Why it's easy:** No deployment knowledge needed, works like regular Python, simple file upload or GitHub sync.

**Steps:**
1. Sign up at https://www.pythonanywhere.com (free tier: 1 web app, 512MB)
2. Upload your code or connect GitHub
3. Open Bash console → Install dependencies: `pip3.10 install --user -r requirements.txt`
4. Set up web app in Web tab → Manual configuration → Python 3.10
5. Configure WSGI file to point to your Django app
6. Add environment variables in Web tab
7. Reload web app

**Note:** Free tier requires renewal every 3 months (one click)

---

### Option 3: **Replit** ⭐ VERY EASY - Perfect for Students

**Why it's easy:** Works right in browser, no setup needed, one-click deploy.

**Steps:**
1. Sign up at https://replit.com
2. Create new Repl → Import from GitHub
3. Replit auto-installs dependencies
4. Add environment variables in Secrets tab
5. Click "Run" → your app is live

**Note:** Free tier may have cold starts

---

### Option 4: **Fly.io** (Free tier available)

Fly.io offers generous free tier for deploying applications.

**Steps:**
1. Install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/
2. Sign up at https://fly.io
3. Navigate to backend: `cd databse/backend/django_backend`
4. Initialize: `fly launch`
5. Follow prompts to configure your app
6. Add environment variables via `fly secrets set`
7. Deploy: `fly deploy`

**Free tier:** 3 shared-cpu VMs, 3GB persistent volumes

---

### Option 5: **Koyeb** ⭐ Easy - Simple & Fast

**Why it's good:** Very simple UI, GitHub integration, free tier: 2 services always-on.

**Steps:**
1. Sign up at https://koyeb.com
2. Create App → GitHub
3. Root path: `databse/backend/django_backend`
4. Build: `pip install -r requirements.txt`
5. Run: `gunicorn backend_django.wsgi:application --bind 0.0.0.0:8000`
6. Add environment variables → Deploy

---

### Option 6: **Heroku** (Paid, requires credit card)

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Add PostgreSQL addon: `heroku addons:create heroku-postgresql:hobby-dev`
5. Set environment variables:
   ```bash
   heroku config:set DJANGO_SECRET=<secret>
   heroku config:set DJANGO_DEBUG=0
   heroku config:set ALLOWED_HOSTS=your-app-name.herokuapp.com
   ```
6. Deploy: `git push heroku main`
7. Run migrations: `heroku run python manage.py migrate`

---

### Option 7: **DigitalOcean App Platform** (Paid)

1. Create account at https://digitalocean.com
2. Apps → Create App → GitHub
3. Select repo and configure:
   - Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - Run command: `gunicorn backend_django.wsgi:application`
4. Add environment variables
5. Deploy

**Pricing:** ~$5-12/month

---

### Option 8: **VPS (Self-Hosted)** - More Control (Requires Setup)

Deploy on DigitalOcean Droplet, Linode, Vultr, or AWS EC2.

**Steps:**
1. Create Ubuntu/Debian VPS
2. Install Python, MySQL, Nginx
3. Set up your app with Gunicorn + Nginx
4. Use systemd for process management

**Guide:** See `VPS_DEPLOYMENT.md` (if needed, I can create this)

---

## Frontend Deployment (Next.js)

### Option 1: **Vercel** (Recommended - Made by Next.js creators)

**Free tier includes:**
- Unlimited deployments
- Automatic HTTPS
- Global CDN

**Steps:**
1. Push code to GitHub
2. Sign up at https://vercel.com
3. Import repository → Select `databse/frontend` folder
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-django-backend.railway.app
   ```
5. Deploy (automatic)

**Note:** Vercel auto-detects Next.js and builds correctly.

---

### Option 2: **Netlify** (Free tier available)

1. Sign up at https://netlify.com
2. New site from Git → Connect repo
3. Build settings:
   - **Base directory:** `databse/frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next` (or configure for static export)
4. Add environment variable: `NEXT_PUBLIC_API_BASE_URL`
5. Deploy

---

### Option 3: **Railway** (Same as backend)

Deploy frontend on Railway too:
1. New service → Deploy from GitHub
2. Root directory: `databse/frontend`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add `NEXT_PUBLIC_API_BASE_URL` environment variable

---

### Option 4: **Cloudflare Pages** (Free tier)

1. Sign up at https://pages.cloudflare.com
2. Connect GitHub repository
3. Build settings:
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`
4. Add environment variable: `NEXT_PUBLIC_API_BASE_URL`
5. Deploy

**Free tier:** Unlimited sites, unlimited requests, global CDN

---

## Complete Deployment Examples

### Example 1: Free/Cheap Setup (Recommended for Students) ⭐ EASIEST

**Stack:**
- **Database:** PlanetScale (free tier)
- **Backend:** Railway (easiest) or PythonAnywhere or Replit (all free)
- **Frontend:** Vercel (free tier)

**Total Cost:** $0/month (with free tiers)

**Why this setup:**
- Railway: Auto-detects Django, one-click deploy, $5 credit/month
- PythonAnywhere: Very simple, no deployment knowledge needed
- Replit: Works in browser, perfect for students
- All are completely free and beginner-friendly

**Steps:**
1. Set up PlanetScale database
2. Deploy Django backend on Railway
3. Deploy Next.js frontend on Vercel
4. Connect everything with environment variables

---

### Example 2: Production Setup

**Stack:**
- **Database:** AWS RDS MySQL or DigitalOcean Managed DB
- **Backend:** Railway, Fly.io, or DigitalOcean App Platform
- **Frontend:** Vercel or Netlify

**Total Cost:** ~$15-50/month

---

## Environment Variables

### Backend (Django) `.env` file:

```env
# Django Settings
DJANGO_SECRET=your-super-secret-key-change-this-in-production
DJANGO_DEBUG=0
ALLOWED_HOSTS=your-backend-domain.com

# Database (use DATABASE_URL OR DB_ENGINE + DB_* variables)
DATABASE_URL=mysql://user:password@host:port/database_name

# OR use individual variables:
DB_ENGINE=django.db.backends.mysql
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=your_database_host
DB_PORT=3306
```

### Frontend `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-django-backend.railway.app
```

**Important:** For deployment platforms, set these as environment variables in their dashboards (not as files).

---

## Quick Start Checklist

Before deploying:

- [ ] Update `ALLOWED_HOSTS` in Django settings to include your production domain
- [ ] Set `DJANGO_DEBUG=0` in production
- [ ] Generate a secure `DJANGO_SECRET` (use: `python -m secrets` or online generator)
- [ ] Ensure `gunicorn` is in `requirements.txt` for Django production
- [ ] Test database connection from your deployment platform
- [ ] Set `NEXT_PUBLIC_API_BASE_URL` in frontend deployment
- [ ] Run migrations: `python manage.py migrate` (usually automated or manual first deploy)
- [ ] Create superuser: `python manage.py createsuperuser` (manual step)

---

## Post-Deployment

1. **Test API endpoints:** Visit `https://your-backend.com/api/` to verify
2. **Test frontend:** Visit frontend URL and verify API connection
3. **Check logs:** Monitor both backend and frontend logs for errors
4. **Set up monitoring:** Consider adding error tracking (Sentry, etc.)
5. **Backup database:** Ensure your database provider handles backups (most managed services do)

---

## Troubleshooting

### Backend Issues:
- **502 Bad Gateway:** Check gunicorn is installed and running
- **Database connection errors:** Verify `DATABASE_URL` is correct
- **CORS errors:** Update `CORS_ALLOW_ALL_ORIGINS` or set specific origins in production

### Frontend Issues:
- **API connection fails:** Verify `NEXT_PUBLIC_API_BASE_URL` points to correct backend URL
- **Build errors:** Check Node.js version compatibility
- **Blank page:** Check browser console for errors

---

## Security Checklist for Production

- [ ] Change `DJANGO_SECRET` to a strong random value
- [ ] Set `DJANGO_DEBUG=0`
- [ ] Use HTTPS (most platforms provide this automatically)
- [ ] Configure CORS properly (don't use `CORS_ALLOW_ALL_ORIGINS` in production)
- [ ] Use strong database passwords
- [ ] Enable database SSL if available
- [ ] Set up proper `ALLOWED_HOSTS`
- [ ] Regular database backups

---

## Need Help?

If you want detailed step-by-step guides for a specific platform, let me know! I can create:
- Detailed Railway deployment guide
- Detailed Vercel deployment guide
- VPS deployment guide
- Docker deployment guide
- Or any other specific platform

---

*Last updated: 2025*


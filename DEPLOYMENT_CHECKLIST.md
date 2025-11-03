# Quick Deployment Checklist

Use this checklist before deploying your application.

## Pre-Deployment

### 1. Database Setup
- [ ] Choose a database provider (PlanetScale, Railway, AWS RDS, etc.)
- [ ] Create database instance
- [ ] Note the connection URL or credentials
- [ ] Test connection locally if possible

### 2. Backend (Django) Setup
- [ ] Generate secure `DJANGO_SECRET` key (run: `python -m secrets` or use online generator)
- [ ] Set `DJANGO_DEBUG=0` for production
- [ ] Configure `ALLOWED_HOSTS` with your domain(s)
- [ ] Set `DATABASE_URL` or database environment variables
- [ ] Test database connection locally with production credentials

### 3. Frontend (Next.js) Setup
- [ ] Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL
- [ ] Verify frontend builds successfully: `npm run build`
- [ ] Test locally with production backend URL

### 4. Code Preparation
- [ ] Commit all changes to Git
- [ ] Push to GitHub (required for most deployment platforms)
- [ ] Review `requirements.txt` includes `gunicorn` and `whitenoise`
- [ ] Review Django `settings.py` has production configurations

---

## Deployment Steps

### Backend Deployment
1. [ ] Sign up on deployment platform 
   - **Easiest:** Railway (auto-detects Django) 
   - **Very Easy:** PythonAnywhere, Replit (browser-based)
   - **Easy:** Fly.io, Koyeb (require CLI or simple setup)
2. [ ] Connect GitHub repository
3. [ ] Set root directory to `databse/backend/django_backend` (if needed)
4. [ ] Add environment variables:
   - `DJANGO_SECRET`
   - `DJANGO_DEBUG=0`
   - `ALLOWED_HOSTS=your-domain.com`
   - `DATABASE_URL` or `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
   - `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com` (optional, for security)
5. [ ] Deploy
6. [ ] Run migrations: `python manage.py migrate` (may be automatic or manual)
7. [ ] Create superuser: `python manage.py createsuperuser` (manual step)
8. [ ] Test API: Visit `https://your-backend.com/api/`

### Frontend Deployment
1. [ ] Sign up on deployment platform (Vercel/Netlify/Railway/etc.)
2. [ ] Connect GitHub repository
3. [ ] Set root directory to `databse/frontend` (if needed)
4. [ ] Add environment variable:
   - `NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com`
5. [ ] Deploy
6. [ ] Test frontend: Visit your frontend URL

---

## Post-Deployment Testing

- [ ] Visit frontend URL - page loads
- [ ] Try logging in - authentication works
- [ ] Test API endpoints from frontend - data loads
- [ ] Check browser console - no errors
- [ ] Check backend logs - no errors
- [ ] Test creating/updating records - CRUD operations work

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check gunicorn is installed, verify start command |
| Database connection failed | Check `DATABASE_URL` is correct, verify database is accessible |
| CORS errors | Add frontend URL to `CORS_ALLOWED_ORIGINS` |
| Static files 404 | Run `python manage.py collectstatic` |
| API connection fails | Verify `NEXT_PUBLIC_API_BASE_URL` matches backend URL exactly |

---

## Environment Variables Reference

### Backend
```env
DJANGO_SECRET=your-secret-key
DJANGO_DEBUG=0
ALLOWED_HOSTS=your-backend-domain.com
DATABASE_URL=mysql://user:pass@host:port/dbname
# OR use:
DB_ENGINE=django.db.backends.mysql
DB_NAME=database_name
DB_USER=username
DB_PASSWORD=password
DB_HOST=host
DB_PORT=3306
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Frontend
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

---

## Recommended Free Tier Setup

**For students/learning projects (easiest options):**

### Option 1: Railway (Easiest - Recommended)
1. **Database:** PlanetScale (free tier)
2. **Backend:** Railway (free tier with $5 credit/month, auto-detects Django)
3. **Frontend:** Vercel (free tier)

### Option 2: PythonAnywhere (Very Easy - Browser-based)
1. **Database:** PlanetScale (free tier)
2. **Backend:** PythonAnywhere (free tier, no deployment knowledge needed)
3. **Frontend:** Vercel (free tier)

### Option 3: Replit (Very Easy - Perfect for Students)
1. **Database:** PlanetScale (free tier)
2. **Backend:** Replit (free tier, works in browser)
3. **Frontend:** Vercel (free tier)

**Total Cost: $0/month for all options**

> 💡 See `FREE_BACKEND_OPTIONS.md` for detailed comparison of all easy free options!

---

*See `DEPLOYMENT_GUIDE.md` for detailed platform-specific instructions.*


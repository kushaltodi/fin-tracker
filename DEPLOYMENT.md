# FinFlux - Vercel Deployment Guide

This guide explains how to deploy FinFlux to Vercel.

## Project Structure

```
fin-tracker/
├── webapp/          # React frontend
├── webapi/          # Express.js backend
├── package.json     # Root build configuration
└── vercel.json      # Vercel deployment configuration
```

## Deployment Steps

### 1. Prepare for Deployment

1. Make sure both frontend and backend work locally
2. Build the React app: `cd webapp && npm run build`
3. Test the combined app: `cd webapi && npm run build && npm start`

### 2. Environment Variables

Set these environment variables in Vercel dashboard:

**Backend (.env)**:

```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### 3. Deploy to Vercel

#### Option A: Vercel CLI

```bash
npm install -g vercel
cd fin-tracker
vercel --prod
```

#### Option B: GitHub Integration

1. Push code to GitHub
2. Connect repository in Vercel dashboard
3. Configure build settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: `webapi`
   - Install Command: `npm install`

### 4. How It Works

1. **Build Process**:

   - React app builds to `webapp/dist/`
   - Files are copied to `webapi/build/`
   - Express server serves static files from `build/`

2. **Routing**:

   - `/api/*` → Express.js API routes
   - `/*` → React app (with client-side routing)

3. **API Configuration**:
   - Production: Uses relative URLs (`/api`)
   - Development: Uses `http://localhost:3000/api`

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + SQLite + JWT
- **Deployment**: Single Vercel serverless function
- **Database**: SQLite file (included in deployment)

## Features

- ✅ Personal Finance Tracking
- ✅ Account Management
- ✅ Transaction Recording
- ✅ Portfolio Tracking
- ✅ Category Management
- ✅ Dashboard Analytics
- ✅ JWT Authentication
- ✅ Indian Rupee (₹) Support

## Local Development

1. **Backend**: `cd webapi && npm run dev`
2. **Frontend**: `cd webapp && npm run dev`
3. **Combined**: `npm run build && cd webapi && npm start`

## Support

For issues, check:

1. Vercel function logs
2. Browser developer console
3. Network requests in DevTools

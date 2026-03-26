# AI PPT Generator - Setup Guide

## What You Need

1. **Node.js** (v18+) - [Download](https://nodejs.org/)
2. **NVIDIA API Key** (Free) - [Get here](https://build.nvidia.com)

---

## Step 1: Get Your API Key

1. Go to https://build.nvidia.com
2. Sign up / Login
3. Copy your API key
4. Save it somewhere safe

---

## Step 2: Install Backend

```powershell
cd server
npm install
```

---

## Step 3: Create `.env` File in `server/` Folder

Create a new file called `.env` with this content:

```
NVIDIA_API_KEY=paste_your_key_here
PORT=5000
```

Replace `paste_your_key_here` with your actual API key from step 1.

---

## Step 4: Install Frontend

```powershell
cd ../client
npm install
```

---

## Step 5: Run the Project

**Open TWO terminals:**

### Terminal 1 - Backend
```powershell
cd server
npm run dev
```

You should see: `🚀 Server running on http://localhost:5000`

### Terminal 2 - Frontend
```powershell
cd client
npm run dev
```

You should see: `➜  Local: http://localhost:5173/`

---

## Step 6: Open in Browser

Go to: **http://localhost:5173**

Enter a topic → Select slides → Click Generate → Download PPT

---

## What Goes Where

| Component | Port | URL |
|-----------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 5000 | http://localhost:5000 |
| NVIDIA API | - | https://build.nvidia.com |

---

## Environment Variables

### `server/.env` (Required)

```
NVIDIA_API_KEY=your_key
PORT=5000
```

### `client/.env` (Optional - only for production)

```
VITE_API_URL=https://your-backend-url.com
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not found" | Check `.env` in server folder |
| "Cannot connect to server" | Make sure backend is running on port 5000 |
| "Request timed out" | Try fewer slides (5-10) |
| Page won't load | Check if frontend is running on port 5173 |

---

## Commands Reference

```powershell
# Start backend
cd server && npm run dev

# Start frontend
cd client && npm run dev

# Build for production
cd client && npm run build
```

---

**That's it! You're ready to go.** 🚀

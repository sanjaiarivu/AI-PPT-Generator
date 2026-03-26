# Quick Start Guide - AI PPT Generator

## 🎯 In 5 Minutes

### 1. Get NVIDIA API Key
- Visit: https://build.nvidia.com
- Create account / Login
- Get your free API key
- Copy it

### 2. Setup Backend
```powershell
cd server
# Create .env file with:
#   NVIDIA_API_KEY=your_key_here
#   PORT=5000

npm install
npm run dev    # Runs on http://localhost:5000
```

### 3. Setup Frontend  
```powershell
cd ../client
npm install
npm run dev    # Runs on http://localhost:5173
```

### 4. Open Browser
http://localhost:5173

---

## 📋 What Goes Where

### Backend Link (Frontend connects to Backend)
Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`  
Via Vite Proxy: `/api/generate` → `http://localhost:5000/generate`

### Environment Variables

#### `server/.env` (REQUIRED)
```
NVIDIA_API_KEY=nvapi-xxxxx
PORT=5000
```

#### `client/.env` (OPTIONAL, only for production)
```
VITE_API_URL=https://your-backend-url.com
```

---

## 🔑 API Keys Required

| API | Where | Cost | How to Get |
|-----|-------|------|-----------|
| NVIDIA NIM | Backend | FREE | https://build.nvidia.com |

---

## 📊 Architecture

```
Browser (http://localhost:5173)
       ↓
Frontend (React + Vite)
       ↓
Backend API (Express.js)
http://localhost:5000
       ↓
NVIDIA NIM API
(Llama 3.1 Nemotron)
       ↓
PptxGenJS
       ↓
Download .pptx file
```

---

## ❌ Stop Server / Clean Restart

```powershell
# Kill backend
# Press Ctrl+C in terminal 1

# Kill frontend  
# Press Ctrl+C in terminal 2

# Clear cache (if issues)
cd server && rm -Recurse node_modules && npm install
cd ../client && rm -Recurse node_modules && npm install

# Restart
npm run dev
```

---

## ✅ Verify Setup

### Test Backend Health
```powershell
# In PowerShell
$response = Invoke-RestMethod http://localhost:5000/health
$response | ConvertTo-Json
```

Should return:
```json
{
  "status": "ok",
  "model": "nvidia/llama-3.1-nemotron-nano-vl-8b-v1"
}
```

### Test Frontend
- Open http://localhost:5173 in browser
- You should see the form to generate presentations

---

## 🚀 Full Setup Commands (Copy & Paste)

### First Time Setup

```powershell
# Navigate to project
cd "S:\FrontEnd\REACT\REACT - ALL PROJECT\PPT Generator\ai-ppt-generator"

# Setup server
cd server
npm install

# Create .env - EDIT THIS FILE AND ADD YOUR NVIDIA API KEY
# Copy from server\.env.example and add your actual API key

cd ../client
npm install

cd ..
# Now ready to run!
```

### Every Time You Want to Run

**Terminal 1 - Backend:**
```powershell
cd "S:\FrontEnd\REACT\REACT - ALL PROJECT\PPT Generator\ai-ppt-generator\server"
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd "S:\FrontEnd\REACT\REACT - ALL PROJECT\PPT Generator\ai-ppt-generator\client"
npm run dev
```

Then open: http://localhost:5173

---

## 📚 See Also

For detailed instructions: Read `SETUP_INSTRUCTIONS.md` in the root folder

---

**Status**: ✅ All Set! Just add your NVIDIA API key and run.

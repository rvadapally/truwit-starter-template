# Truwit API - MVP/POC

A simple Express.js API for Truwit video verification service.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The API will run on `http://localhost:5080`

### 3. Test the API
```bash
# Health check
curl http://localhost:5080/health

# Create proof from URL
curl -X POST http://localhost:5080/v1/proofs \
  -H "Content-Type: application/json" \
  -d '{
    "input": {"url": "https://youtube.com/watch?v=example"},
    "declared": {
      "generator": "Sora v2",
      "prompt": "A cat dancing",
      "license": "creator-owned"
    }
  }'
```

## 📋 API Endpoints

### Health Check
- **GET** `/health` - Check if API is running

### Proof Creation
- **POST** `/v1/proofs` - Create proof from video URL
- **POST** `/v1/proofs/file` - Create proof from uploaded file

### Verification
- **GET** `/v1/verify/:id` - Get verification details

### Badges
- **GET** `/badges/:id.png` - Get verification badge (SVG)

## 🔧 Configuration

The API is configured to work with:
- **Frontend**: `http://localhost:4200` (Angular dev server)
- **Production**: `https://truwit.ai` (Cloudflare Pages)

## 📝 Notes

This is a **MVP/POC version** with:
- ✅ Mock data generation
- ✅ In-memory storage
- ✅ Basic validation
- ✅ CORS configuration
- ✅ File upload support

**Next steps for production:**
- Replace mock data with real video processing
- Add database storage
- Implement proper authentication
- Add rate limiting
- Deploy to Cloudflare Workers

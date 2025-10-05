# Truwit Verification App - Complete Documentation

## 🎯 **Project Overview**

Truwit is a content verification platform that creates cryptographic proofs for digital media, particularly AI-generated content. The system consists of an Angular frontend and a .NET API backend, deployed on Cloudflare Pages.

## 🏗️ **Architecture**

### **Frontend (Angular)**
- **Location**: `humanproof-starter/truwit-integrated/app/`
- **Framework**: Angular 17+ with TypeScript
- **Styling**: SCSS with custom dark theme
- **Routing**: Single Page Application with Angular Router

### **Backend (.NET API)**
- **Location**: `humanproof-starter/api/`
- **Framework**: ASP.NET Core 8.0
- **Database**: In-memory repository (POC)
- **Documentation**: Swagger/OpenAPI

### **Deployment**
- **Platform**: Cloudflare Pages
- **Build Process**: Integrated Astro + Angular build
- **Domain**: `https://truwit.ai`

## 🚀 **Core Functionality**

### **1. Content Verification Flow**

#### **URL Verification**
```
User Input → Angular Form → .NET API → Mock Response → Success Message
```

**Process:**
1. User enters YouTube URL in Angular form
2. Angular calls `/v1/proofs` endpoint
3. .NET API creates mock proof (instant response for YouTube URLs)
4. Returns `CreateProofResponse` with proof ID and verification URL
5. Angular displays success message with action buttons

#### **File Upload Verification**
```
File Upload → Angular Form → .NET API → Hash Computation → Proof Creation
```

**Process:**
1. User uploads video file (MP4, MOV, AVI, etc.)
2. Angular calls `/v1/proofs/file` endpoint
3. .NET API processes file and computes hashes
4. Creates verification proof and stores in repository
5. Returns proof details

### **2. Public Verification Pages**

**URL Pattern**: `/t/{proofId}` (e.g., `/t/ABC12345`)

**Process:**
1. Angular `PublicVerifyComponent` loads proof ID from route
2. Calls `/v1/verify/{proofId}` endpoint
3. Displays verification details, verdict, and metadata
4. Shows sharing options and badge

## 📁 **Project Structure**

```
humanproof-starter/
├── api/                                    # .NET API Backend
│   ├── Controllers/
│   │   ├── VerificationController.cs      # Legacy endpoints
│   │   └── ProofsController.cs             # New API endpoints
│   ├── Application/
│   │   ├── DTOs/                          # Data Transfer Objects
│   │   └── Services/                      # Business Logic
│   ├── Domain/
│   │   ├── Entities/                      # Domain Models
│   │   ├── Enums/                         # Verification Types
│   │   └── Interfaces/                    # Repository Contracts
│   ├── Infrastructure/
│   │   ├── Repositories/                   # Data Access
│   │   └── Services/                      # External Services
│   └── Program.cs                         # API Configuration
├── truwit-integrated/                      # Frontend + Deployment
│   ├── app/                               # Angular Application
│   │   ├── src/app/
│   │   │   ├── core/
│   │   │   │   ├── models/                # TypeScript Interfaces
│   │   │   │   └── services/              # API Services
│   │   │   ├── features/
│   │   │   │   ├── home/                  # Landing Page
│   │   │   │   └── verification/          # Verification Components
│   │   │   └── app.routes.ts              # Angular Routing
│   │   └── angular.json                   # Angular Configuration
│   ├── src/                               # Astro Static Site
│   │   ├── pages/
│   │   │   ├── index.astro                # Marketing Landing Page
│   │   │   └── app.astro                  # Angular App Wrapper
│   │   └── components/                    # Astro Components
│   ├── package.json                       # Build Configuration
│   └── wrangler.json                      # Cloudflare Configuration
└── README.md
```

## 🔧 **API Endpoints**

### **New API (v1)**
- `POST /v1/proofs` - Create proof from URL
- `POST /v1/proofs/file` - Create proof from file upload
- `GET /v1/verify/{id}` - Get verification details

### **Legacy API (v1)**
- `POST /api/v1/verification/upload` - File upload verification
- `POST /api/v1/verification/url` - URL verification
- `GET /api/v1/verification/proof/{proofId}` - Get proof details

### **Utility Endpoints**
- `GET /health` - Health check
- `GET /badges/{id}.png` - Generate verification badges
- `GET /swagger` - API documentation

## 🎨 **User Interface**

### **Main Components**

#### **HomeComponent** (`/`)
- Landing page with feature highlights
- Call-to-action to verification page
- Marketing content and branding

#### **VerifyPageComponent** (`/verify`)
- Main verification form
- File upload and URL input options
- Metadata collection (prompt, tool, license)
- Real-time status updates

#### **PublicVerifyComponent** (`/t/:id`)
- Public verification results
- Proof details and verdict display
- Sharing options (Twitter, copy link)
- Badge display

### **Key UI Features**
- **Dark theme** with blue/green gradient accents
- **Responsive design** for mobile and desktop
- **Loading animations** with progress bars
- **Success/error messaging** with visual feedback
- **Form validation** with real-time feedback

## 🚀 **Development Setup**

### **Prerequisites**
- Node.js 18+
- .NET 8.0 SDK
- Git

### **Local Development**

#### **1. Start .NET API**
```bash
cd humanproof-starter/api
dotnet run
# API runs on http://localhost:5000
# Swagger UI: http://localhost:5000/swagger
```

#### **2. Start Angular Frontend**
```bash
cd humanproof-starter/truwit-integrated/app
npm install
npm start
# Frontend runs on http://localhost:4200
```

#### **3. Start Astro Site (Optional)**
```bash
cd humanproof-starter/truwit-integrated
npm install
npm run dev
# Site runs on http://localhost:4321
```

### **Environment Configuration**

#### **Angular Environment** (`app/src/environments/`)
```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000'
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  apiUrl: 'https://api.truwit.ai'
};
```

## 🌐 **Cloudflare Pages Deployment**

### **Build Process**
The deployment uses an integrated build system:

1. **Angular Build**: Compiles Angular app with production settings
2. **Astro Build**: Generates static marketing site
3. **Integration**: Combines both into single `dist/` folder
4. **Deployment**: Uploads to Cloudflare Pages

### **Build Commands**
```bash
# Full build (Angular + Astro + Integration)
npm run build

# Individual builds
npm run build:app      # Angular only
npm run build:astro    # Astro only
npm run integrate      # Combine builds
```

### **Deployment Configuration**

#### **Cloudflare Pages Settings**
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`
- **Node.js Version**: 18+

#### **Routing Configuration** (`public/_routes.json`)
```json
[{ "src": "/.*", "dest": "/index.html" }]
```

#### **Angular Base Href** (`angular.json`)
```json
{
  "build": {
    "options": {
      "baseHref": "/"  // Development
    },
    "configurations": {
      "production": {
        "baseHref": "/app/"  // Production
      }
    }
  }
}
```

### **Deployment Commands**
```bash
# Deploy to Cloudflare Pages
npm run deploy

# Manual deployment
npx wrangler pages deploy ./dist --project-name=truwit-starter-template
```

## 🔧 **Configuration Files**

### **Package.json Scripts**
```json
{
  "scripts": {
    "dev": "astro dev",
    "dev:app": "cd app && npm start",
    "dev:both": "concurrently \"npm run dev:app\" \"npm run dev\"",
    "build": "npm run build:app && npm run build:astro && npm run integrate",
    "build:app": "cd app && npm install && npm run build -- --base-href=/app/",
    "build:astro": "astro check && astro build",
    "integrate": "node build-integration.js",
    "deploy": "npm run build && npx wrangler pages deploy ./dist --project-name=truwit-starter-template"
  }
}
```

### **Wrangler Configuration** (`wrangler.json`)
```json
{
  "name": "truwit-starter-template",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "dist"
}
```

## 🧪 **Testing the Application**

### **1. Local Testing**
1. Start both servers (API + Angular)
2. Navigate to `http://localhost:4200/verify`
3. Enter YouTube URL: `https://www.youtube.com/watch?v=LixDSK0BRFS`
4. Click "🚀 Generate Proof"
5. Verify success message appears
6. Click "View Verification Details" to see public page

### **2. Production Testing**
1. Deploy to Cloudflare Pages
2. Visit `https://truwit.ai/app/verify`
3. Test the same verification flow
4. Verify public pages work: `https://truwit.ai/app/t/{proofId}`

## 🐛 **Known Issues & Limitations**

### **Current Limitations**
- **Mock Processing**: YouTube URLs return instant mock responses
- **In-Memory Storage**: Proofs are lost on API restart
- **No Real Verification**: No actual content analysis or hash verification
- **Limited File Types**: Only video files accepted
- **No Authentication**: No user accounts or authentication system

### **Common Issues**
- **CORS Errors**: Ensure API CORS is configured for frontend domain
- **Build Failures**: Check Node.js version compatibility
- **Routing Issues**: Verify `_routes.json` is deployed correctly
- **API Timeouts**: YouTube URL processing may be slow without mock responses

## 🔮 **Next Steps for Development**

### **Immediate Improvements**
1. **Database Integration**: Replace in-memory repository with SQL Server/PostgreSQL
2. **Real Video Processing**: Implement actual content hash computation
3. **Authentication System**: Add user accounts and JWT authentication
4. **Enhanced UI**: Add more verification result details and sharing options

### **Advanced Features**
1. **Blockchain Integration**: Store proofs on blockchain
2. **AI Detection**: Implement actual AI content detection
3. **Batch Processing**: Support multiple file uploads
4. **API Rate Limiting**: Implement proper rate limiting and security

## 📞 **Support & Troubleshooting**

### **Common Commands**
```bash
# Check running processes
tasklist | findstr dotnet
tasklist | findstr node

# Kill processes
Stop-Process -Id <PID>

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### **Debug Information**
- **API Logs**: Check console output from `dotnet run`
- **Angular Logs**: Check browser console for errors
- **Network Tab**: Monitor API calls in browser dev tools
- **Swagger UI**: Test API endpoints directly at `/swagger`

---

**Last Updated**: January 2025  
**Version**: MVP 1.0  
**Status**: Functional POC with basic verification flow working
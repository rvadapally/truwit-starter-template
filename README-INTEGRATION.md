# Truwit Integrated Project

This repository contains both the Astro landing page and the Angular verification app, configured for seamless deployment to Cloudflare Pages.

## 🏗️ Project Structure

```
truwit-integrated/
├── src/                    # Astro landing page
│   ├── pages/
│   │   └── index.astro    # Main landing page
│   └── components/
├── app/                   # Angular verification app
│   ├── src/
│   │   └── app/
│   │       ├── app.component.ts
│   │       └── app.module.ts
│   └── dist/              # Built Angular files
├── public/                # Static assets (images, fonts)
├── build-integration.js   # Script to copy Angular to Astro dist
└── package.json          # Root package.json with build scripts
```

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Run Astro landing page (localhost:4321)
npm run dev

# Run Angular app (localhost:4200) in a separate terminal
npm run dev:app
```

### Building for Production

```bash
# Build both projects
npm run build

# Preview the built site
npm run preview
```

## 📦 Deployment to Cloudflare Pages

### Automatic Deployment (Recommended)

1. Push this repository to GitHub
2. Connect your GitHub repository to Cloudflare Pages
3. Configure build settings in Cloudflare:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave blank)

4. Every push to `main` will automatically deploy!

### Manual Deployment

```bash
npm run deploy
```

## 🎨 How It Works

1. **Landing Page** (`/`): Astro-powered static site with beautiful dark theme
2. **Verification App** (`/app/`): Angular SPA for media verification
3. **Build Integration**: 
   - Angular app builds to `app/dist/humanproof-web/`
   - Astro builds to `dist/`
   - Integration script copies Angular build to `dist/app/`
   - Both are served from the same Cloudflare deployment

## 🌐 URL Structure

- **Landing Page**: `https://yoursite.com/`
- **Verification App**: `https://yoursite.com/app/`
- **API Endpoints** (future): `https://yoursite.com/api/`

## 🎨 Theme Consistency

Both the Astro landing page and Angular app share the same design system:
- Dark gradient background (`#0e1b35` to `#0b1220`)
- Gradient text effects (cyan `#0ea5e9` to green `#22c55e`)
- Consistent typography and spacing
- Matching button styles and interactions

## 📝 Development Workflow

### 1. Update Landing Page
Edit files in `src/pages/` and `src/components/`

### 2. Update Angular App
```bash
cd app
# Make your changes in src/app/
npm start  # Test locally
```

### 3. Commit and Push
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Cloudflare Pages will automatically build and deploy!

## 🔧 Configuration

### Angular App
- Configuration: `app/angular.json`
- Styling: Inline in `app/src/app/app.component.ts`
- API Base URL: `http://localhost:5299` (development)

### Astro Landing Page
- Configuration: `astro.config.mjs`
- Global styles: `src/styles/global.css`

## 📚 Resources

- [Astro Documentation](https://docs.astro.build)
- [Angular Documentation](https://angular.io/docs)
- [Cloudflare Pages](https://pages.cloudflare.com)

## 🎯 Next Steps

- [ ] Add .NET API integration
- [ ] Implement file upload functionality
- [ ] Add authentication (Phase 2)
- [ ] Connect to backend verification service
- [ ] Add real-time verification status updates

---

Built with ❤️ using Astro, Angular, and Cloudflare Pages

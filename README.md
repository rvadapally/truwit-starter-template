
## 📌 Project: Truwit

### **Description**

Truwit is a lightweight, extensible verification layer for digital media. It provides a way to attach cryptographic provenance, authenticity, and consent data to AI-generated or user-created content. With Truwit, creators, rightsholders, and audiences can easily distinguish verified content from synthetic or manipulated media.

The project is built as a **modular starter kit** with:

* **Backend (C# .NET)** — API endpoints for authentication, content verification, and metadata sealing.
* **Frontend (Angular)** — A simple UI to display, check, and manage Truwit verification badges.
* **Database (SQL or NoSQL option)** — To store verification records and provenance data.
* **Authentication (Phase 1: Google OAuth)** — Easy, fast login to get started. Future-ready for wallet or decentralized identity (DID) integration.

---

### **Vision**

We are building the **trust layer for the AI age**.

As generative AI floods social feeds and media channels, authenticity becomes the new scarcity. Truwit ensures that every piece of content can carry a **witness mark** — a cryptographic guarantee of provenance, consent, and truth.

Our vision:

* **Creators**: protect their likeness and work with verified provenance.
* **Platforms**: reduce misinformation by surfacing authenticated content.
* **Audiences**: know what’s real, what’s synthetic, and who approved it.

Ultimately, Truwit aims to become the **“SSL certificate” for media content** — simple, universal, and indispensable for trust in the digital world.



# HumanProof Starter (Phase‑1)
Angular 17 + Auth0 (Google sign‑in) + .NET 8 Minimal APIs

## Included
- **web/**: Angular 17 (standalone) with Auth0 Angular. Public Verify, protected Brand Console.
- **api/**: .NET 8 Minimal APIs with JwtBearer (Auth0). Public /verify + /t/:id; protected /precheck.
- **data/receipts/**: dev JSON receipts. **storage/**: dev uploads.

## Quick start
1) Auth0: create SPA + API. Enable Google. Set callback `http://localhost:4200/callback`, logout `http://localhost:4200/`, web origin `http://localhost:4200`.
2) API:
   ```bash
   cd api && dotnet restore && dotnet run
   # http://localhost:5299
   ```
3) Web:
   ```bash
   cd web && npm install && npm start
   # http://localhost:4200
   ```

## Configure
- API: `api/appsettings.Development.json` → Domain, Audience
- Web: `web/src/app/auth.config.ts` → domain, clientId, audience, api base

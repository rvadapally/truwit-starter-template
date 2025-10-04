import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="main-container">
      <header class="header">
        <h1 class="brand-name">Truwit</h1>
        <p class="subtitle gradient-text">Where Provenance Meets Proof</p>
      </header>
      
      <main class="content-section">
        <div class="card">
          <h2 class="card-title">
            <span class="gradient-text-primary">Verify origin. Prove consent.</span>
            <span class="gradient-text-secondary">Publish with confidence.</span>
          </h2>
          <p class="card-description">Drop a file or paste a URL to receive a TrustMark and a verify link.</p>
          
          <div class="input-section">
            <label class="input-label">Paste URL</label>
            <div class="input-group">
              <input type="url" placeholder="https://example.com/video.mp4" class="url-input">
              <button class="btn-primary">Verify URL</button>
            </div>
          </div>
          
          <div class="divider">or</div>
          
          <div class="input-section">
            <label class="input-label">Upload file</label>
            <input type="file" class="file-input">
          </div>
          
          <div class="verified-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            <span>Trusted by creators worldwide</span>
          </div>
        </div>
      </main>
      
      <footer class="footer">
        <p>© {{currentYear}} Truwit. All rights reserved.</p>
      </footer>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :host {
      display: block;
      min-height: 100vh;
      background: radial-gradient(1200px 600px at 70% -10%, #0e1b35 0%, #0b1220 60%);
      color: #e6eefc;
      font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
    }

    .main-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .brand-name {
      font-weight: 800;
      font-size: clamp(2rem, 5vw, 3rem);
      letter-spacing: 0.05em;
      color: #e6eefc;
      text-shadow: 0 0 30px rgba(14, 165, 233, 0.5);
      margin-bottom: 0.5rem;
    }

    .subtitle {
      font-size: clamp(1rem, 2.5vw, 1.4rem);
      font-weight: 300;
      margin: 0;
    }

    .gradient-text {
      background: linear-gradient(135deg, #0ea5e9, #22c55e);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .gradient-text-primary {
      background: linear-gradient(135deg, #0ea5e9, #22c55e);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      display: block;
      margin-bottom: 0.5rem;
    }

    .gradient-text-secondary {
      background: linear-gradient(135deg, #22c55e, #0ea5e9);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      display: block;
    }

    .content-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .card {
      background: rgba(14, 27, 53, 0.6);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(14, 165, 233, 0.2);
      border-radius: 20px;
      padding: 2.5rem;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .card-title {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 600;
      margin-bottom: 1rem;
      line-height: 1.3;
    }

    .card-description {
      color: #cfe0ff;
      font-size: clamp(1rem, 2vw, 1.2rem);
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .input-section {
      margin-bottom: 1.5rem;
    }

    .input-label {
      display: block;
      font-weight: 500;
      color: #9fb3d9;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
    }

    .input-group {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .url-input, .file-input {
      flex: 1;
      min-width: 200px;
      padding: 0.875rem 1rem;
      background: rgba(11, 18, 32, 0.8);
      border: 2px solid rgba(14, 165, 233, 0.3);
      border-radius: 12px;
      color: #e6eefc;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .url-input:focus, .file-input:focus {
      outline: none;
      border-color: #0ea5e9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }

    .url-input::placeholder {
      color: #6b7a96;
    }

    .file-input {
      cursor: pointer;
    }

    .file-input::file-selector-button {
      padding: 0.5rem 1rem;
      background: rgba(14, 165, 233, 0.2);
      border: 1px solid rgba(14, 165, 233, 0.3);
      border-radius: 8px;
      color: #0ea5e9;
      cursor: pointer;
      margin-right: 0.75rem;
      transition: all 0.2s ease;
    }

    .file-input::file-selector-button:hover {
      background: rgba(14, 165, 233, 0.3);
    }

    .btn-primary {
      padding: 0.875rem 1.75rem;
      background: linear-gradient(135deg, #0ea5e9, #22c55e);
      border: none;
      border-radius: 12px;
      color: #08111f;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 10px 30px rgba(34, 197, 94, 0.3);
      white-space: nowrap;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(34, 197, 94, 0.4);
      background: linear-gradient(135deg, #0284c7, #16a34a);
    }

    .divider {
      text-align: center;
      color: #6b7a96;
      margin: 1.5rem 0;
      font-size: 0.9rem;
      position: relative;
    }

    .divider::before,
    .divider::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 40%;
      height: 1px;
      background: rgba(159, 179, 217, 0.2);
    }

    .divider::before {
      left: 0;
    }

    .divider::after {
      right: 0;
    }

    .verified-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      margin-top: 2rem;
      background: rgba(14, 165, 233, 0.1);
      border: 1px solid rgba(14, 165, 233, 0.2);
      border-radius: 12px;
      color: #0ea5e9;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .verified-badge svg {
      width: 20px;
      height: 20px;
    }

    .footer {
      text-align: center;
      padding-top: 2rem;
      margin-top: 2rem;
      border-top: 1px solid rgba(159, 179, 217, 0.2);
    }

    .footer p {
      color: #9fb3d9;
      font-size: 0.9rem;
      font-weight: 300;
    }

    @media (max-width: 768px) {
      .main-container {
        padding: 1.5rem 1rem;
      }

      .card {
        padding: 2rem 1.5rem;
      }

      .input-group {
        flex-direction: column;
      }

      .url-input {
        min-width: 100%;
      }

      .btn-primary {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .header {
        margin-bottom: 2rem;
      }

      .card {
        padding: 1.5rem 1rem;
      }

      .verified-badge {
        font-size: 0.85rem;
        padding: 0.6rem 1rem;
      }
    }
  `]
})
export class AppComponent {
  title = 'Truwit';
  currentYear = new Date().getFullYear();
}
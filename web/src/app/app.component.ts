import { Component } from '@angular/core';
import { VerificationComponent } from './components/verification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VerificationComponent],
  template: `
    <div class="container">
      <header class="header">
        <h1>Truwit</h1>
        <p class="subtitle">Where Provenance Meets Proof</p>
      </header>
      
      <main class="main-content">
        <app-verification></app-verification>
      </main>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
    }
    
    .subtitle {
      font-size: 1.1rem;
      color: #666;
      margin: 10px 0 0 0;
    }
    
    .main-content {
      display: flex;
      justify-content: center;
    }
    
    .card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e5e5;
      width: 100%;
      max-width: 600px;
    }
    
    .card h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 10px 0;
    }
    
    .card p {
      color: #666;
      margin: 0 0 30px 0;
      line-height: 1.5;
    }
    
    .input-section {
      margin-bottom: 20px;
    }
    
    .input-section label {
      display: block;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }
    
    .input-group {
      display: flex;
      gap: 10px;
    }
    
    .url-input, .file-input {
      flex: 1;
      padding: 12px;
      border: 2px solid #e5e5e5;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    
    .url-input:focus, .file-input:focus {
      outline: none;
      border-color: #6C63FF;
    }
    
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: #6C63FF;
      color: white;
    }
    
    .btn-primary:hover {
      background: #5a52e8;
      transform: translateY(-1px);
    }
    
    .divider {
      text-align: center;
      color: #999;
      margin: 20px 0;
      font-size: 14px;
    }
  `]
})
export class AppComponent {
  title = 'Truwit';
}
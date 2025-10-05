import { Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-verify-page',
  template: `
    <div class="verification-page">
      <!-- Verification Form (shown when no result) -->
      <div class="verification-form" *ngIf="!verificationResult">
        <app-verification-form></app-verification-form>
      </div>
      
      <!-- Verification Result (shown when result exists) -->
      <div class="verification-result" *ngIf="verificationResult">
        <app-verification-result [result]="verificationResult"></app-verification-result>
        
        <div class="new-verification-section">
          <button class="btn-secondary" (click)="onNewVerification()">
            Verify Another Content
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verification-page {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .verification-form, .verification-result {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2rem;
    }
    
    .new-verification-section {
      text-align: center;
      margin-top: 2rem;
    }
    
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #e6eefc;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  `]
})
export class VerifyPageComponent implements OnInit {
  verificationResult: any = null;
  
  ngOnInit(): void {
    console.log('✅ VerifyPageComponent loaded!');
    console.log('📍 Current URL:', window.location.href);
  }
  
  onNewVerification(): void {
    this.verificationResult = null;
  }
}

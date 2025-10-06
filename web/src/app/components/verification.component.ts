import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VerificationService, VerificationStep, CreateProofFromUrlResponse, CreateProofFromFileResponse } from '../services/verification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="verification-container">
      <div class="card">
        <h2>Verify origin. Prove consent. Publish with confidence.</h2>
        <p>Drop a file or paste a URL to receive a TrustMark and a verify link.</p>
        
        <!-- URL Input Section -->
        <div class="input-section">
          <label>Paste URL</label>
          <div class="input-group">
            <input 
              type="url" 
              [(ngModel)]="urlInput" 
              placeholder="https://www.tiktok.com/@user/video/1234567890" 
              class="url-input"
              [disabled]="isProcessing">
            <button 
              class="btn btn-primary" 
              (click)="verifyUrl()"
              [disabled]="!urlInput || isProcessing">
              {{ isProcessing ? 'Verifying...' : 'Verify URL' }}
            </button>
          </div>
        </div>
        
        <div class="divider">or</div>
        
        <!-- File Upload Section -->
        <div class="input-section">
          <label>Upload file</label>
          <input 
            type="file" 
            #fileInput
            (change)="onFileSelected($event)"
            class="file-input"
            [disabled]="isProcessing">
          
          <!-- Optional Fields (Collapsible) -->
          <div class="optional-fields" [class.expanded]="showOptionalFields">
            <button 
              type="button" 
              class="toggle-btn"
              (click)="toggleOptionalFields()">
              {{ showOptionalFields ? 'Hide' : 'Show' }} Optional Fields
            </button>
            
            <div class="optional-content" *ngIf="showOptionalFields">
              <div class="field-group">
                <label>Likeness Owner Name</label>
                <input 
                  type="text" 
                  [(ngModel)]="likenessOwnerName" 
                  placeholder="Name of person in the content"
                  class="text-input">
              </div>
              
              <div class="field-group">
                <label>Consent Evidence URL</label>
                <input 
                  type="url" 
                  [(ngModel)]="consentEvidenceUrl" 
                  placeholder="https://example.com/consent-proof"
                  class="url-input">
              </div>
            </div>
          </div>
        </div>
        
        <!-- Progress Steps -->
        <div class="progress-section" *ngIf="verificationSteps.length > 0">
          <h3>Verification Progress</h3>
          <div class="steps">
            <div 
              *ngFor="let step of verificationSteps" 
              class="step"
              [class.completed]="step.completed"
              [class.error]="step.error">
              <div class="step-indicator">
                <span *ngIf="step.completed">✓</span>
                <span *ngIf="step.error">✗</span>
                <span *ngIf="!step.completed && !step.error">{{ getStepNumber(step) }}</span>
              </div>
              <div class="step-content">
                <div class="step-message">{{ step.message }}</div>
                <div class="step-error" *ngIf="step.error">{{ step.error }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Result Section -->
        <div class="result-section" *ngIf="result">
          <div class="result-card" [class.deduped]="result.deduped">
            <div class="result-header">
              <h3>{{ result.deduped ? 'Found Existing Proof' : 'Verification Complete' }}</h3>
              <div class="status-badge" [class.verified]="result.deduped || true">
                {{ result.deduped ? 'Deduplicated' : 'Verified' }}
              </div>
            </div>
            
            <div class="result-content">
              <div class="result-item">
                <label>Proof ID:</label>
                <span class="proof-id">{{ result.proofId }}</span>
              </div>
              
              <div class="result-item">
                <label>TrustMark ID:</label>
                <span class="trustmark-id">{{ result.trustmarkId }}</span>
              </div>
              
              <div class="result-actions">
                <button class="btn btn-secondary" (click)="viewProofPage()">
                  View Proof Page
                </button>
                <button class="btn btn-secondary" (click)="downloadReceipt()">
                  Download Receipt (PDF)
                </button>
                <button class="btn btn-secondary" (click)="copyEmbedBadge()">
                  Copy Embed Badge
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Error Section -->
        <div class="error-section" *ngIf="error">
          <div class="error-card">
            <h3>Verification Failed</h3>
            <p>{{ error }}</p>
            <button class="btn btn-primary" (click)="reset()">Try Again</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verification-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e5e5;
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
    
    .url-input, .file-input, .text-input {
      flex: 1;
      padding: 12px;
      border: 2px solid #e5e5e5;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    
    .url-input:focus, .file-input:focus, .text-input:focus {
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
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn-primary {
      background: #6C63FF;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: #5a52e8;
      transform: translateY(-1px);
    }
    
    .btn-secondary {
      background: #f8f9fa;
      color: #333;
      border: 1px solid #e5e5e5;
    }
    
    .btn-secondary:hover {
      background: #e9ecef;
    }
    
    .divider {
      text-align: center;
      color: #999;
      margin: 20px 0;
      font-size: 14px;
    }
    
    .optional-fields {
      margin-top: 15px;
    }
    
    .toggle-btn {
      background: none;
      border: none;
      color: #6C63FF;
      cursor: pointer;
      font-size: 14px;
      padding: 5px 0;
    }
    
    .optional-content {
      margin-top: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .field-group {
      margin-bottom: 15px;
    }
    
    .field-group:last-child {
      margin-bottom: 0;
    }
    
    .progress-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
    }
    
    .progress-section h3 {
      margin: 0 0 15px 0;
      font-size: 1.1rem;
      color: #333;
    }
    
    .steps {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .step {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border-radius: 8px;
      background: #f8f9fa;
    }
    
    .step.completed {
      background: #d4edda;
    }
    
    .step.error {
      background: #f8d7da;
    }
    
    .step-indicator {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #6C63FF;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }
    
    .step.completed .step-indicator {
      background: #28a745;
    }
    
    .step.error .step-indicator {
      background: #dc3545;
    }
    
    .step-content {
      flex: 1;
    }
    
    .step-message {
      font-weight: 500;
      color: #333;
    }
    
    .step-error {
      font-size: 14px;
      color: #dc3545;
      margin-top: 2px;
    }
    
    .result-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
    }
    
    .result-card {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 8px;
      padding: 20px;
    }
    
    .result-card.deduped {
      background: #fff3cd;
      border-color: #ffeaa7;
    }
    
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .result-header h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #333;
    }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      background: #28a745;
      color: white;
    }
    
    .status-badge.verified {
      background: #ffc107;
      color: #333;
    }
    
    .result-item {
      margin-bottom: 10px;
    }
    
    .result-item label {
      font-weight: 500;
      color: #666;
      margin-right: 8px;
    }
    
    .proof-id, .trustmark-id {
      font-family: monospace;
      background: rgba(0,0,0,0.1);
      padding: 2px 6px;
      border-radius: 4px;
    }
    
    .result-actions {
      margin-top: 20px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .error-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
    }
    
    .error-card {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      padding: 20px;
    }
    
    .error-card h3 {
      margin: 0 0 10px 0;
      color: #721c24;
    }
    
    .error-card p {
      margin: 0 0 15px 0;
      color: #721c24;
    }
  `]
})
export class VerificationComponent implements OnInit, OnDestroy {
  urlInput = '';
  likenessOwnerName = '';
  consentEvidenceUrl = '';
  showOptionalFields = false;
  verificationSteps: VerificationStep[] = [];
  result: CreateProofFromUrlResponse | CreateProofFromFileResponse | null = null;
  error: string | null = null;
  isProcessing = false;
  
  private subscriptions: Subscription[] = [];

  constructor(private verificationService: VerificationService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.verificationService.verificationSteps$.subscribe(steps => {
        this.verificationSteps = steps;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  verifyUrl(): void {
    if (!this.urlInput || this.isProcessing) return;
    
    this.isProcessing = true;
    this.error = null;
    this.result = null;
    
    const idempotencyKey = this.generateIdempotencyKey();
    
    this.verificationService.createProofFromUrl(this.urlInput, idempotencyKey).subscribe({
      next: (response) => {
        this.result = response;
        this.isProcessing = false;
        this.verificationService.clearSteps();
      },
      error: (err) => {
        this.error = err.error?.message || 'Verification failed';
        this.isProcessing = false;
        this.verificationService.setError('verifying', this.error);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.verifyFile(input.files[0]);
    }
  }

  verifyFile(file: File): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.error = null;
    this.result = null;
    
    const request = {
      likenessOwnerName: this.likenessOwnerName || undefined,
      consentEvidenceUrl: this.consentEvidenceUrl || undefined
    };
    
    this.verificationService.createProofFromFile(file, request).subscribe({
      next: (response) => {
        this.result = response;
        this.isProcessing = false;
        this.verificationService.clearSteps();
      },
      error: (err) => {
        this.error = err.error?.message || 'File verification failed';
        this.isProcessing = false;
        this.verificationService.setError('uploading', this.error);
      }
    });
  }

  toggleOptionalFields(): void {
    this.showOptionalFields = !this.showOptionalFields;
  }

  getStepNumber(step: VerificationStep): number {
    return this.verificationSteps.indexOf(step) + 1;
  }

  viewProofPage(): void {
    if (this.result) {
      window.open(`/t/${this.result.trustmarkId}`, '_blank');
    }
  }

  downloadReceipt(): void {
    if (this.result) {
      // This would trigger a download of the PDF receipt
      console.log('Download receipt for:', this.result.proofId);
    }
  }

  copyEmbedBadge(): void {
    if (this.result) {
      const badgeUrl = `${window.location.origin}/badges/${this.result.trustmarkId}.png`;
      navigator.clipboard.writeText(`<img src="${badgeUrl}" alt="Verified by Truwit" />`);
      // Show a toast notification
      console.log('Embed badge copied to clipboard');
    }
  }

  reset(): void {
    this.urlInput = '';
    this.likenessOwnerName = '';
    this.consentEvidenceUrl = '';
    this.showOptionalFields = false;
    this.result = null;
    this.error = null;
    this.isProcessing = false;
    this.verificationService.clearSteps();
  }

  private generateIdempotencyKey(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

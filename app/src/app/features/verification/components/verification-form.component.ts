import { Component, ChangeDetectionStrategy, type OnInit, type OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { VerificationService } from '../../../core/services/verification.service';
import type { VerificationRequest, VerificationMetadata, CreateProofResponse } from '../../../core/models';
import { LicenseType } from '../../../core/models';

@Component({
  selector: 'app-verification-form',
  templateUrl: './verification-form.component.html',
  styleUrls: ['./verification-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerificationFormComponent implements OnInit, OnDestroy {
  verificationForm: FormGroup;
  selectedFile: File | null = null;
  isVerifying = false;
  verificationResult: any = null;
  
  private destroy$ = new Subject<void>();
  
  readonly licenseTypes = [
    { value: LicenseType.CreatorOwned, label: 'Creator Owned' },
    { value: LicenseType.BrandOwned, label: 'Brand Owned' },
    { value: LicenseType.Public, label: 'Public' }
  ];

  constructor(
    private fb: FormBuilder,
    private verificationService: VerificationService
  ) {
    this.verificationForm = this.createForm();
  }

  ngOnInit(): void {
    this.verificationService.verificationResult$
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.verificationResult = result;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      url: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      prompt: [''],
      toolName: [''],
      toolVersion: [''],
      likenessConsent: [[]],
      license: [LicenseType.CreatorOwned, Validators.required]
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      // Clear URL when file is selected
      this.verificationForm.patchValue({ url: '' });
    }
  }

  onUrlChange(): void {
    // Clear file when URL is entered
    if (this.verificationForm.get('url')?.value) {
      this.selectedFile = null;
    }
  }

  onSubmit(): void {
    if (this.verificationForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.verificationForm.value;
    this.isVerifying = true;
    
    // Prepare common parameters
    const generator = formValue.toolName || 'Unknown';
    const prompt = formValue.prompt || '';
    const license = formValue.license || LicenseType.CreatorOwned;
    
    let verification$;
    
    if (this.selectedFile) {
      // File upload verification
      verification$ = this.verificationService.createProofFromFile(this.selectedFile, generator, prompt, license);
    } else if (formValue.url) {
      // URL verification
      verification$ = this.verificationService.createProofFromUrl(formValue.url, generator, prompt, license);
    } else {
      this.isVerifying = false;
      return;
    }
    
    verification$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: CreateProofResponse) => {
          // Redirect to the verify URL as specified in your requirements
          window.location.href = result.verifyUrl;
        },
        error: (error) => {
          console.error('Verification failed:', error);
          this.isVerifying = false;
          // TODO: Show user-friendly error message
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.verificationForm.controls).forEach(key => {
      const control = this.verificationForm.get(key);
      control?.markAsTouched();
    });
  }

  resetForm(): void {
    this.verificationForm.reset();
    this.selectedFile = null;
    this.verificationService.clearVerificationResult();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

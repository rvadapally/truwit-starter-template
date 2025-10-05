import { Component, ChangeDetectionStrategy, ChangeDetectorRef, type OnInit, type OnDestroy } from '@angular/core';
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
  errorMessage: string | null = null;
  successMessage: string | null = null;
  verificationStep: string = '';
  createdProof: CreateProofResponse | null = null;
  
  private destroy$ = new Subject<void>();
  
  readonly licenseTypes = [
    { value: LicenseType.CreatorOwned, label: 'Creator Owned' },
    { value: LicenseType.BrandOwned, label: 'Brand Owned' },
    { value: LicenseType.Public, label: 'Public' }
  ];

  constructor(
    private fb: FormBuilder,
    private verificationService: VerificationService,
    private cdr: ChangeDetectorRef
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
      const file = input.files[0];
      
      // Validate file type - only allow video files
      if (!this.isVideoFile(file)) {
        alert('Please select a video file only. Supported formats: MP4, MOV, AVI, MKV, WebM, M4V, 3GP, FLV, WMV');
        input.value = ''; // Clear the input
        this.selectedFile = null;
        return;
      }
      
      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 100MB');
        input.value = ''; // Clear the input
        this.selectedFile = null;
        return;
      }
      
      this.selectedFile = file;
      // Clear URL when file is selected
      this.verificationForm.patchValue({ url: '' });
    }
  }

  private isVideoFile(file: File): boolean {
    const videoTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm',
      'video/x-m4v',
      'video/3gpp',
      'video/x-flv',
      'video/x-ms-wmv'
    ];
    
    const videoExtensions = [
      '.mp4', '.mov', '.avi', '.mkv', '.webm', 
      '.m4v', '.3gp', '.flv', '.wmv'
    ];
    
    // Check MIME type
    if (videoTypes.includes(file.type)) {
      return true;
    }
    
    // Check file extension as fallback
    const fileName = file.name.toLowerCase();
    return videoExtensions.some(ext => fileName.endsWith(ext));
  }

  onUrlChange(): void {
    // Clear file when URL is entered
    if (this.verificationForm.get('url')?.value) {
      this.selectedFile = null;
    }
  }

  onSubmit(): void {
    console.log('🚀 onSubmit() called');
    console.log('📋 Form valid:', this.verificationForm.valid);
    console.log('📋 Form value:', this.verificationForm.value);
    
    if (this.verificationForm.invalid) {
      console.log('❌ Form is invalid, marking as touched');
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.verificationForm.value;
    console.log('📝 Form values:', formValue);
    console.log('📁 Selected file:', this.selectedFile);
    
            this.isVerifying = true;
            this.errorMessage = null;
            this.successMessage = null;
            this.verificationStep = 'Preparing verification...';
            
            console.log('🔄 Starting verification process...');
    
    // Prepare common parameters
    const generator = formValue.toolName || 'Unknown';
    const prompt = formValue.prompt || '';
    const license = formValue.license || LicenseType.CreatorOwned;
    
    console.log('⚙️ Parameters:', { generator, prompt, license });
    
    let verification$;
    
            if (this.selectedFile) {
              console.log('📁 File upload verification selected');
              this.verificationStep = 'Uploading file...';
              // File upload verification
              verification$ = this.verificationService.createProofFromFile(this.selectedFile, generator, prompt, license);
            } else if (formValue.url) {
              console.log('🔗 URL verification selected:', formValue.url);
              this.verificationStep = 'Processing URL...';
              // URL verification
              verification$ = this.verificationService.createProofFromUrl(formValue.url, generator, prompt, license);
            } else {
              console.log('❌ No file or URL provided');
              this.isVerifying = false;
              return;
            }
    
            console.log('📡 Making API call...');
            this.verificationStep = 'Creating cryptographic proof...';
            
            verification$
              .pipe(takeUntil(this.destroy$))
              .subscribe({
        next: (result: CreateProofResponse) => {
          console.log('✅ API Success!', result);
          
          // Force immediate UI update
          setTimeout(() => {
            this.verificationStep = 'Verification complete!';
            this.successMessage = `🎉 Proof created successfully! Proof ID: ${result.proofId}`;
            this.isVerifying = false;
            this.createdProof = result;
            
            // Force change detection
            this.cdr.detectChanges();
            
            console.log('✅ Proof created:', result.proofId);
            console.log('🔗 Verify URL:', result.verifyUrl);
            console.log('🏆 Badge URL:', result.badgeUrl);
            console.log('🎉 SUCCESS MESSAGE SHOULD BE VISIBLE NOW!');
          }, 100);
        },
        error: (error) => {
          console.error('❌ API Error:', error);
          console.error('❌ Error details:', {
            status: error.status,
            message: error.message,
            error: error.error
          });
          this.isVerifying = false;
          this.errorMessage = this.getErrorMessage(error);
          console.log('💬 Error message shown to user:', this.errorMessage);
        }
      });
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    if (error.status === 0) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (error.status === 400) {
      return 'Invalid request. Please check your input and try again.';
    }
    if (error.status === 500) {
      return 'Server error. Please try again later.';
    }
    return 'An unexpected error occurred. Please try again.';
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
            this.isVerifying = false;
            this.errorMessage = null;
            this.successMessage = null;
            this.verificationStep = '';
            this.createdProof = null;
            this.verificationService.clearVerificationResult();
          }

          visitVerificationPage(): void {
            if (this.createdProof) {
              window.open(this.createdProof.verifyUrl, '_blank');
            }
          }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

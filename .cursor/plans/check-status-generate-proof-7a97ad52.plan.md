<!-- 7a97ad52-4536-4269-90c6-c987a7413e59 bd40857f-66b0-482e-abd6-48a6f2176454 -->
# Fix URL Validation, File Support, and Error Visibility

## Critical UX Issues to Fix

1. URL validation not working in production (old build deployed)
2. File uploads only accept videos, need to support images too
3. Loading spinner stuck indefinitely on errors
4. Error messages hidden in console instead of visible to users

## Backend Changes

### 1. Add URL Validation to Backend Endpoints

**File**: `api/Controllers/ProofsController.cs`

The `IsValidUrl()` helper already exists (line 389). Add validation to URL endpoints:

- Line 94-103: `CreateProofFromUrl` - validation already added ✓
- Line 762: `LookupProof` - validation already added ✓

### 2. Expand File Type Support for Images

**File**: `api/Controllers/ProofsController.cs`

Line 998 - Update allowed MIME types:

```csharp
var allowedMimeTypes = new List<string> { 
    // Video formats
    "video/mp4", "video/avi", "video/mov", "video/webm", "video/quicktime",
    // Image formats
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
    "image/bmp", "image/tiff", "image/x-icon"
};
```

Update error message (line 1002):

```csharp
Message = $"Unsupported file type: {file.ContentType}. Allowed: video (mp4, avi, mov, webm, quicktime) and image (jpg, png, gif, webp, bmp, tiff) files"
```

## Frontend Changes

### 3. Create Global Toast Notification Service

**New File**: `app/src/app/core/services/notification.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastNotification {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new Subject<ToastNotification>();
  notification$ = this.notificationSubject.asObservable();

  showSuccess(message: string, duration = 5000): void {
    this.notificationSubject.next({ message, type: 'success', duration });
  }

  showError(message: string, duration = 8000): void {
    this.notificationSubject.next({ message, type: 'error', duration });
  }

  showWarning(message: string, duration = 6000): void {
    this.notificationSubject.next({ message, type: 'warning', duration });
  }

  showInfo(message: string, duration = 5000): void {
    this.notificationSubject.next({ message, type: 'info', duration });
  }
}
```

### 4. Create Toast Notification Component

**New File**: `app/src/app/shared/components/toast-notification/toast-notification.component.ts`

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService, ToastNotification } from '../../../core/services/notification.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast-notification',
  templateUrl: './toast-notification.component.html',
  styleUrls: ['./toast-notification.component.scss'],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastNotificationComponent implements OnInit, OnDestroy {
  notifications: (ToastNotification & { id: number })[] = [];
  private destroy$ = new Subject<void>();
  private nextId = 0;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        const id = this.nextId++;
        const notificationWithId = { ...notification, id };
        this.notifications.push(notificationWithId);

        setTimeout(() => {
          this.removeNotification(id);
        }, notification.duration || 5000);
      });
  }

  removeNotification(id: number): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '';
    }
  }
}
```

**New File**: `app/src/app/shared/components/toast-notification/toast-notification.component.html`

```html
<div class="toast-container">
  <div *ngFor="let notification of notifications" 
       [@toastAnimation]
       class="toast toast-{{notification.type}}"
       (click)="removeNotification(notification.id)">
    <span class="toast-icon">{{ getIcon(notification.type) }}</span>
    <span class="toast-message">{{ notification.message }}</span>
    <button class="toast-close" (click)="removeNotification(notification.id)">×</button>
  </div>
</div>
```

**New File**: `app/src/app/shared/components/toast-notification/toast-notification.component.scss`

```scss
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
}

.toast-success {
  background: #22c55e;
  color: white;
}

.toast-error {
  background: #ef4444;
  color: white;
}

.toast-warning {
  background: #f59e0b;
  color: white;
}

.toast-info {
  background: #3b82f6;
  color: white;
}

.toast-icon {
  font-size: 20px;
  font-weight: bold;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .toast-container {
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
```

### 5. Add Toast Component to App Root

**File**: `app/src/app/app.component.html`

Add at the top of the template:

```html
<app-toast-notification></app-toast-notification>
<router-outlet></router-outlet>
```

**File**: `app/src/app/app.component.ts` or module

Import and declare ToastNotificationComponent in the appropriate module/standalone imports.

### 6. Fix Verification Form Error Handling

**File**: `app/src/app/features/verification/components/verification-form.component.ts`

Inject NotificationService in constructor:

```typescript
constructor(
  private fb: FormBuilder,
  private verificationService: VerificationService,
  private cdr: ChangeDetectorRef,
  private router: Router,
  private notificationService: NotificationService
) {
  this.verificationForm = this.createForm();
}
```

Update `onSubmit()` error handler (around line 200):

```typescript
error: (error) => {
  console.error('❌ API Error:', error);
  this.isVerifying = false;
  const errorMsg = this.getErrorMessage(error);
  this.errorMessage = errorMsg;
  this.notificationService.showError(errorMsg);
  this.cdr.detectChanges();
}
```

Update `onCheckStatus()` error handler:

```typescript
error: (error) => {
  this.isVerifying = false;
  const errorMsg = error.status === 404 
    ? 'No proof found for this URL' 
    : this.getErrorMessage(error);
  this.errorMessage = errorMsg;
  this.notificationService.showError(errorMsg);
  this.cdr.markForCheck();
}
```

Add validation check at start of onSubmit (after existing checks):

```typescript
// Validate URL format if URL is provided
if (formValue.url && !this.isValidUrl(formValue.url)) {
  const errorMsg = 'Please enter a valid URL (e.g., https://example.com/video.mp4)';
  this.errorMessage = errorMsg;
  this.notificationService.showError(errorMsg);
  this.cdr.detectChanges();
  return;
}
```

Add the `isValidUrl` helper method:

```typescript
private isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}
```

### 7. Update File Input to Accept Images

**File**: `app/src/app/features/verification/components/verification-form.component.html`

Find the file input (around line 85) and update accept attribute:

```html
<input 
  type="file" 
  id="fileInput"
  accept="video/*,image/*"
  (change)="onFileSelected($event)"
  #fileInput
>
```

Update helper text:

```html
<small class="file-help">
  Supported formats: Video (MP4, AVI, MOV, WebM) and Image (JPG, PNG, GIF, WebP, BMP, TIFF)
</small>
```

### 8. Add Loading State Timeout Protection

**File**: `app/src/app/features/verification/components/verification-form.component.ts`

Add timeout protection to prevent infinite spinner:

```typescript
private verificationTimeout?: ReturnType<typeof setTimeout>;

onSubmit(): void {
  // ... existing code ...
  
  this.isVerifying = true;
  
  // Set timeout protection (2 minutes)
  this.verificationTimeout = setTimeout(() => {
    if (this.isVerifying) {
      this.isVerifying = false;
      const timeoutMsg = 'Verification timed out. Please try again.';
      this.errorMessage = timeoutMsg;
      this.notificationService.showError(timeoutMsg);
      this.cdr.detectChanges();
    }
  }, 120000);

  verification$
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (result) => {
        clearTimeout(this.verificationTimeout);
        // ... existing success handling ...
      },
      error: (error) => {
        clearTimeout(this.verificationTimeout);
        // ... existing error handling ...
      }
    });
}
```

Update ngOnDestroy:

```typescript
ngOnDestroy(): void {
  if (this.verificationTimeout) {
    clearTimeout(this.verificationTimeout);
  }
  this.destroy$.next();
  this.destroy$.complete();
}
```

### 9. Apply Error Notifications to Other Forms

Apply similar notification patterns to:

- `app/src/app/features/verification/components/public-verify.component.ts`
- `app/src/app/features/home/home.component.ts`  
- Any other components with form submissions or API calls

Inject NotificationService and call `showError()` / `showSuccess()` in error/success handlers.

### 10. Update Shared Module

**File**: `app/src/app/shared/shared.module.ts` (or appropriate module file)

Export ToastNotificationComponent so it can be used throughout the app.

## Testing Checklist

- [ ] Invalid URLs show immediate error toast (no API call)
- [ ] Valid URLs that fail show error toast with proper message
- [ ] Image files (jpg, png, gif, webp, bmp, tiff) can be uploaded
- [ ] Video files still work as before
- [ ] Loading spinner stops on errors (no infinite spin)
- [ ] Error messages visible to users (not just console)
- [ ] Toast notifications appear at top of screen
- [ ] Toast notifications auto-dismiss after 5-8 seconds
- [ ] Multiple toasts stack properly
- [ ] Toast notifications work on mobile (responsive)

## To-dos

- [ ] Update backend file type validation to include all image formats
- [ ] Create NotificationService for global toast notifications
- [ ] Create ToastNotificationComponent with animations
- [ ] Add toast component to app root template
- [ ] Update verification-form component to use notifications
- [ ] Add frontend URL validation to onSubmit method
- [ ] Update file input to accept image formats
- [ ] Add timeout protection to prevent infinite loading
- [ ] Apply notification pattern to all forms throughout app
- [ ] Test error visibility and toast notifications across all flows

### To-dos

- [ ] Create GET /v1/proofs/lookup endpoint with canonicalization and read-only repository lookup
- [ ] Replace single 'Verify URL' button with 'Check Status' and 'Generate Proof' buttons in verification form
- [ ] Implement onCheckStatus() method and add lookupProof() service call
- [ ] Verify and fix Idempotency-Key header implementation in api.service.ts
- [ ] Add formatUtcTime() and formatLocalTime() methods to properly display user's local timezone
- [ ] Remove red styling from C2PA status and add neutral 'Not signed' / 'Skipped' labels
- [ ] Create static badge images and implement conditional badge display based on C2PA status
- [ ] Update API_FUNCTIONALITY.md and README.md with new lookup endpoint and two-button flow
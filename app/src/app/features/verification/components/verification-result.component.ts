import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import type { VerificationResult } from '../../../core/models';

@Component({
  selector: 'app-verification-result',
  templateUrl: './verification-result.component.html',
  styleUrls: ['./verification-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerificationResultComponent {
  @Input({ required: true }) result!: VerificationResult;

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard:', text);
    });
  }

  downloadBadge(): void {
    // Implementation for downloading the badge
    const link = document.createElement('a');
    link.href = this.result.badgeUrl;
    link.download = `truwit-badge-${this.result.proofId}.png`;
    link.click();
  }

  downloadQRCode(): void {
    if (this.result.qrCodeUrl) {
      const link = document.createElement('a');
      link.href = this.result.qrCodeUrl;
      link.download = `truwit-qr-${this.result.proofId}.png`;
      link.click();
    }
  }
}

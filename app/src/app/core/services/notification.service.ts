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

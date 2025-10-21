import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-secondary-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      type="button" 
      class="btn-secondary" 
      [disabled]="disabled"
      (click)="onClick()">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .btn-secondary {
      background: transparent;
      color: var(--color-text-primary);
      border: 2px solid rgba(255, 255, 255, 0.25);
      padding: 10px 30px;
      border-radius: var(--border-radius-sm);
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-fast);
      font-family: var(--font-primary);
      font-size: 1rem;
      
      &:hover:not(:disabled) {
        border-color: var(--color-accent-primary);
        color: var(--color-accent-primary);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  `]
})
export class SecondaryButtonComponent {
  @Input() disabled = false;
  
  onClick() {
    // Handle click events
  }
}

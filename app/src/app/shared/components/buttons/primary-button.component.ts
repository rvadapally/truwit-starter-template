import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-primary-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      type="button" 
      class="btn-primary" 
      [disabled]="disabled"
      (click)="onClick()">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .btn-primary {
      background: var(--color-accent-primary);
      color: var(--color-bg-primary);
      padding: 12px 32px;
      border-radius: var(--border-radius-sm);
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: var(--transition-fast);
      text-decoration: none;
      display: inline-block;
      font-family: var(--font-primary);
      font-size: 1rem;
      
      &:hover:not(:disabled) {
        background: var(--color-accent-hover);
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }
      
      &:active:not(:disabled) {
        transform: translateY(0);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  `]
})
export class PrimaryButtonComponent {
  @Input() disabled = false;
  
  onClick() {
    // Handle click events
  }
}

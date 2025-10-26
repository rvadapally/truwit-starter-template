import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Identity {
  identity_token: string;
  identity_id: string;
  provider: string;
  handle: string;
  display_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private currentUserSubject = new BehaviorSubject<Identity | null>(this.getStoredIdentity());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    console.log('🔐 AuthService initialized');
  }

  /**
   * Get stored identity from localStorage
   */
  private getStoredIdentity(): Identity | null {
    try {
      const stored = localStorage.getItem('truwit_identity');
      if (stored) {
        const identity = JSON.parse(stored);
        console.log('✅ Found stored identity:', identity.provider, identity.handle);
        return identity;
      }
    } catch (error) {
      console.error('❌ Failed to parse stored identity:', error);
      localStorage.removeItem('truwit_identity');
    }
    return null;
  }

  /**
   * Store identity in localStorage
   */
  private storeIdentity(identity: Identity): void {
    try {
      localStorage.setItem('truwit_identity', JSON.stringify(identity));
      console.log('💾 Stored identity:', identity.provider, identity.handle);
    } catch (error) {
      console.error('❌ Failed to store identity:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): Identity | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get JWT token
   */
  getToken(): string | null {
    const user = this.currentUserSubject.value;
    return user?.identity_token || null;
  }

  /**
   * Sign in anonymously
   */
  signInAnonymously(): Observable<Identity> {
    console.log('🔄 Signing in anonymously...');
    return this.http.post<Identity>(`${environment.apiUrl}/v1/auth/anonymous`, {}).pipe(
      tap(identity => {
        console.log('✅ Anonymous sign-in successful:', identity);
        this.storeIdentity(identity);
        this.currentUserSubject.next(identity);
      })
    );
  }

  /**
   * Sign in with Twitter (redirects to OAuth page)
   */
  signInWithTwitter(): void {
    console.log('🐦 Redirecting to Twitter OAuth...');
    // Store return URL before redirect
    sessionStorage.setItem('truwit_return_url', window.location.pathname);
    window.location.href = `${environment.apiUrl}/v1/auth/login/twitter`;
  }

  /**
   * Sign in with Google (redirects to OAuth page)
   */
  signInWithGoogle(): void {
    console.log('🔵 Redirecting to Google OAuth...');
    // Store return URL before redirect
    sessionStorage.setItem('truwit_return_url', window.location.pathname);
    window.location.href = `${environment.apiUrl}/v1/auth/login/google`;
  }

  /**
   * Handle OAuth callback (called after redirect from OAuth provider)
   * This should be called when the user returns from Twitter/Google
   */
  handleOAuthCallback(identity: Identity): void {
    console.log('✅ OAuth callback received:', identity);
    this.storeIdentity(identity);
    this.currentUserSubject.next(identity);

    // Redirect to return URL or home
    const returnUrl = sessionStorage.getItem('truwit_return_url') || '/';
    sessionStorage.removeItem('truwit_return_url');
    window.location.href = returnUrl;
  }

  /**
   * Sign out
   */
  signOut(): void {
    console.log('👋 Signing out...');
    localStorage.removeItem('truwit_identity');
    this.currentUserSubject.next(null);
  }
}


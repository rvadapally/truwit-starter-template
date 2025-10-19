import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { ApiResponse, ErrorResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('🔧 ApiService initialized with API URL:', this.apiUrl);
  }

  get<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}${endpoint}`).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    const fullUrl = `${this.apiUrl}${endpoint}`;
    
    // Generate unique idempotency key per request
    const idempotencyKey = this.generateIdempotencyKey();
    const headers = new HttpHeaders().set('Idempotency-Key', idempotencyKey);
    
    console.log('🌐 ApiService.post called:');
    console.log('📍 URL:', fullUrl);
    console.log('🔑 Idempotency-Key:', idempotencyKey);
    console.log('📤 Data:', data);
    
    return this.http.post<ApiResponse<T>>(fullUrl, data, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, data).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.apiUrl}${endpoint}`).pipe(
      catchError(this.handleError)
    );
  }

  uploadFile<T>(endpoint: string, file: File, additionalData?: any): Observable<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.http.post<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, formData).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private generateIdempotencyKey(): string {
    // Generate unique key: timestamp + random string
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

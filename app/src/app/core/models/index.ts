// Core models for Truwit application

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
  success: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

// Verification related models
export interface VerificationRequest {
  url?: string;
  file?: File;
  metadata?: VerificationMetadata;
}

export interface VerificationMetadata {
  prompt?: string;
  toolName?: string;
  toolVersion?: string;
  likenessConsent?: string[];
  license?: LicenseType;
}

export enum LicenseType {
  CreatorOwned = 'creator-owned',
  BrandOwned = 'brand-owned',
  Public = 'public'
}

// API Request/Response models matching your specification
export interface CreateProofRequest {
  input: {
    url: string;
  };
  declared: {
    generator: string;
    prompt: string;
    license: string;
  };
}

export interface CreateProofResponse {
  proofId: string;
  verifyUrl: string;
  badgeUrl: string;
}

export interface VerifyResponse {
  proofId: string;
  verdict: 'green' | 'yellow' | 'red';
  contentHash: string;
  mime?: string;
  duration?: number;
  resolution?: string;
  declared: {
    generator: string;
    prompt: string;
    license: string;
  };
  issuedAt: string;
  signatureStatus: 'valid' | 'invalid' | 'unknown';
}

// Legacy models for backward compatibility
export interface VerificationResult {
  proofId: string;
  contentHash: string;
  perceptualHash: string;
  metadata: VerificationMetadata;
  timestamp: string;
  verificationUrl: string;
  badgeUrl: string;
  qrCodeUrl?: string;
}

export interface ProofDetails {
  proofId: string;
  contentHash: string;
  perceptualHash: string;
  metadata: VerificationMetadata;
  timestamp: string;
  signature: string;
  isValid: boolean;
}

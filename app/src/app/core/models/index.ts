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
  CreatorOwned = 'CREATOR_OWNED',
  BrandOwned = 'BRAND_OWNED',
  Public = 'PUBLIC'
}

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

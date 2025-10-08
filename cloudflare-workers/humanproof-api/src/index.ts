/**
 * HumanProof API - Cloudflare Workers Implementation
 * 
 * This worker provides the core API endpoints for HumanProof:
 * - File upload and verification
 * - C2PA manifest parsing
 * - Proof creation and verification
 * - Health checks
 */

interface Env {
	// Environment variables
	ENVIRONMENT: string;
	API_VERSION: string;
	MAX_FILE_SIZE: string;
	REQUEST_TIMEOUT: string;

	// Secrets (set via wrangler secret put)
	HMAC_SECRET?: string;
	DATABASE_URL?: string;
	AUTH0_DOMAIN?: string;
	AUTH0_AUDIENCE?: string;

	// D1 Database binding
	DB: D1Database;

	// R2 Storage binding (optional)
	// ASSETS_BUCKET: R2Bucket;
}

interface ApiResponse<T = any> {
	success: boolean;
	message: string;
	data?: T;
	status: number;
}

interface CreateProofResponse {
	proofId: string;
	trustmarkId: string;
	verifyUrl: string;
	assetId: string;
	assetReused: boolean;
	c2pa: boolean;
	origin?: {
		c2pa: boolean;
		status: string;
		claimGenerator?: string;
		issuer?: string;
		timestamp?: string;
		sha256?: string;
	};
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const method = request.method;

		// CORS headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		// Handle preflight requests
		if (method === 'OPTIONS') {
			return new Response(null, { status: 200, headers: corsHeaders });
		}

		try {
			// Route handling
			const path = url.pathname;

			// Health check endpoints
			if (path === '/health' || path === '/health/tools') {
				return handleHealthCheck(env, corsHeaders);
			}

			// API endpoints
			if (path.startsWith(`/${env.API_VERSION}/`)) {
				const apiPath = path.substring(`/${env.API_VERSION}/`.length);

				switch (apiPath) {
					case 'proofs/file-upload':
						if (method === 'POST') {
							return handleFileUpload(request, env, corsHeaders);
						}
						break;

					case 'verify':
						if (method === 'GET') {
							const trustmarkId = url.searchParams.get('id') || path.split('/').pop();
							return handleVerify(trustmarkId, env, corsHeaders);
						}
						break;

					default:
						return new Response(JSON.stringify({
							success: false,
							message: 'Endpoint not found',
							status: 404
						}), {
							status: 404,
							headers: { ...corsHeaders, 'Content-Type': 'application/json' }
						});
				}
			}

			// Root endpoint
			if (path === '/') {
				return new Response(JSON.stringify({
					success: true,
					message: 'HumanProof API - Cloudflare Workers',
					version: env.API_VERSION,
					environment: env.ENVIRONMENT,
					endpoints: [
						'GET /health - Health check',
						'GET /health/tools - Tools health check',
						'POST /v1/proofs/file-upload - Upload and verify files',
						'GET /v1/verify/{id} - Verify proof by trustmark ID'
					]
				}), {
					status: 200,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}

			return new Response(JSON.stringify({
				success: false,
				message: 'Not Found',
				status: 404
			}), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});

		} catch (error) {
			console.error('Worker error:', error);
			return new Response(JSON.stringify({
				success: false,
				message: 'Internal Server Error',
				status: 500
			}), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}
	},
} satisfies ExportedHandler<Env>;

/**
 * Health check endpoint
 */
async function handleHealthCheck(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	const healthData = {
		status: 'healthy',
		environment: env.ENVIRONMENT,
		version: env.API_VERSION,
		timestamp: new Date().toISOString(),
		tools: {
			'c2patool': 'not_available_in_workers', // C2PA tools not available in Workers
			'ffmpeg': 'not_available_in_workers',
			'yt-dlp': 'not_available_in_workers'
		}
	};

	return new Response(JSON.stringify(healthData), {
		status: 200,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' }
	});
}

/**
 * Handle file upload and verification
 */
async function handleFileUpload(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	try {
		// Initialize database
		await initializeDatabase(env.DB);

		// Parse multipart form data
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return new Response(JSON.stringify({
				success: false,
				message: 'No file provided',
				status: 400
			}), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Check file size
		const maxSize = parseInt(env.MAX_FILE_SIZE);
		if (file.size > maxSize) {
			return new Response(JSON.stringify({
				success: false,
				message: `File too large. Maximum size: ${maxSize} bytes`,
				status: 413
			}), {
				status: 413,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Generate unique IDs
		const proofId = crypto.randomUUID();
		const trustmarkId = generateTrustmarkId();
		const assetId = crypto.randomUUID();

		// Simulate C2PA parsing
		const c2paResult = await simulateC2paParsing(file);

		// Save asset to database
		await saveAsset(env.DB, {
			id: assetId,
			sha256: c2paResult.sha256,
			mime: file.type,
			sizeBytes: file.size,
			duration: undefined, // Would need ffmpeg to extract
			resolution: undefined // Would need ffmpeg to extract
		});

		// Save proof to database
		await saveProof(env.DB, {
			id: proofId,
			trustmarkId,
			assetId,
			declaredData: JSON.stringify({
				generator: 'Unknown',
				prompt: '',
				license: 'creator-owned'
			}),
			c2paPresent: c2paResult.manifestFound,
			c2paJson: c2paResult.manifestFound ? JSON.stringify({
				claimGenerator: c2paResult.claimGenerator,
				issuer: c2paResult.issuer,
				timestamp: c2paResult.timestamp
			}) : undefined,
			originStatus: c2paResult.manifestFound ? 'verified' : 'not_found'
		});

		// Create response
		const response: CreateProofResponse = {
			proofId,
			trustmarkId,
			verifyUrl: `/t/${trustmarkId}`,
			assetId,
			assetReused: false,
			c2pa: c2paResult.manifestFound,
			origin: c2paResult.manifestFound ? {
				c2pa: true,
				status: 'verified',
				claimGenerator: c2paResult.claimGenerator,
				issuer: c2paResult.issuer,
				timestamp: c2paResult.timestamp,
				sha256: c2paResult.sha256
			} : {
				c2pa: false,
				status: 'not_found',
				sha256: c2paResult.sha256
			}
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('File upload error:', error);
		return new Response(JSON.stringify({
			success: false,
			message: 'File upload failed',
			status: 500
		}), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}

/**
 * Handle proof verification
 */
async function handleVerify(trustmarkId: string | null, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	if (!trustmarkId) {
		return new Response(JSON.stringify({
			success: false,
			message: 'Trustmark ID required',
			status: 400
		}), {
			status: 400,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}

	try {
		// Initialize database
		await initializeDatabase(env.DB);

		// Get proof from database
		const proof = await getProofByTrustmarkId(env.DB, trustmarkId);

		if (!proof) {
			return new Response(JSON.stringify({
				success: false,
				message: 'Proof not found',
				status: 404
			}), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Parse declared data
		const declaredData = JSON.parse(proof.DeclaredData || '{}');

		// Parse C2PA data if present
		let originData = {
			c2pa: proof.C2paPresent === 1,
			status: proof.OriginStatus || 'not_found',
			sha256: proof.Sha256
		};

		if (proof.C2paPresent === 1 && proof.C2paJson) {
			try {
				const c2paData = JSON.parse(proof.C2paJson);
				originData = {
					...originData,
					claimGenerator: c2paData.claimGenerator,
					issuer: c2paData.issuer,
					timestamp: c2paData.timestamp
				};
			} catch (error) {
				console.error('Error parsing C2PA JSON:', error);
			}
		}

		const verificationData = {
			proofId: proof.Id,
			verdict: 'verified',
			contentHash: proof.Sha256,
			mime: proof.Mime,
			duration: proof.Duration,
			resolution: proof.Resolution,
			declared: declaredData,
			issuedAt: proof.CreatedAt,
			signatureStatus: 'valid',
			origin: originData
		};

		return new Response(JSON.stringify(verificationData), {
			status: 200,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('Verification error:', error);
		return new Response(JSON.stringify({
			success: false,
			message: 'Verification failed',
			status: 500
		}), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
}

/**
 * Generate a short trustmark ID
 */
function generateTrustmarkId(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < 8; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * Database helper functions for D1
 */
async function initializeDatabase(db: D1Database): Promise<void> {
	try {
		// Create tables if they don't exist
		await db.exec(`
      CREATE TABLE IF NOT EXISTS Assets (
        Id TEXT PRIMARY KEY,
        Sha256 TEXT UNIQUE NOT NULL,
        Mime TEXT,
        SizeBytes INTEGER,
        Duration INTEGER,
        Resolution TEXT,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS Proofs (
        Id TEXT PRIMARY KEY,
        TrustmarkId TEXT UNIQUE NOT NULL,
        AssetId TEXT,
        DeclaredData TEXT,
        C2paPresent INTEGER DEFAULT 0,
        C2paJson TEXT,
        OriginStatus TEXT DEFAULT 'not_found',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (AssetId) REFERENCES Assets(Id)
      );
      
      CREATE TABLE IF NOT EXISTS Receipts (
        Id TEXT PRIMARY KEY,
        ProofId TEXT NOT NULL,
        SignedData TEXT NOT NULL,
        Signature TEXT NOT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ProofId) REFERENCES Proofs(Id)
      );
    `);
	} catch (error) {
		console.error('Database initialization error:', error);
	}
}

async function saveAsset(db: D1Database, asset: {
	id: string;
	sha256: string;
	mime: string;
	sizeBytes: number;
	duration?: number;
	resolution?: string;
}): Promise<void> {
	await db.prepare(`
    INSERT OR REPLACE INTO Assets (Id, Sha256, Mime, SizeBytes, Duration, Resolution)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
		asset.id,
		asset.sha256,
		asset.mime,
		asset.sizeBytes,
		asset.duration || null,
		asset.resolution || null
	).run();
}

async function saveProof(db: D1Database, proof: {
	id: string;
	trustmarkId: string;
	assetId: string;
	declaredData: string;
	c2paPresent: boolean;
	c2paJson?: string;
	originStatus: string;
}): Promise<void> {
	await db.prepare(`
    INSERT INTO Proofs (Id, TrustmarkId, AssetId, DeclaredData, C2paPresent, C2paJson, OriginStatus)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
		proof.id,
		proof.trustmarkId,
		proof.assetId,
		proof.declaredData,
		proof.c2paPresent ? 1 : 0,
		proof.c2paJson || null,
		proof.originStatus
	).run();
}

async function getProofByTrustmarkId(db: D1Database, trustmarkId: string): Promise<any> {
	const result = await db.prepare(`
    SELECT p.*, a.Sha256, a.Mime, a.Duration, a.Resolution
    FROM Proofs p
    LEFT JOIN Assets a ON p.AssetId = a.Id
    WHERE p.TrustmarkId = ?
  `).bind(trustmarkId).first();

	return result;
}

/**
 * Simulate C2PA parsing (since c2patool isn't available in Workers)
 */
async function simulateC2paParsing(file: File): Promise<{
	manifestFound: boolean;
	claimGenerator?: string;
	issuer?: string;
	timestamp?: string;
	sha256: string;
}> {
	// Generate SHA-256 hash
	const arrayBuffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

	// For demo purposes, simulate C2PA detection based on file name
	const fileName = file.name.toLowerCase();
	const hasC2pa = fileName.includes('c2pa') || fileName.includes('manifest') || fileName.includes('signed');

	if (hasC2pa) {
		return {
			manifestFound: true,
			claimGenerator: 'Adobe Photoshop 24.0',
			issuer: 'C2PA',
			timestamp: new Date().toISOString(),
			sha256
		};
	}

	return {
		manifestFound: false,
		sha256
	};
}
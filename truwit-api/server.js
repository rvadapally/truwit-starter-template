const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5080;

// Middleware
app.use(cors({
  origin: ['http://localhost:4200', 'https://truwit.ai'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// In-memory storage for POC (replace with database later)
const proofs = new Map();
const verifications = new Map();

// Helper function to generate proof ID
function generateProofId() {
  return 'tw_' + uuidv4().replace(/-/g, '').substring(0, 12);
}

// Helper function to simulate video processing
async function processVideo(url, declared) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock data
  const contentHash = 'sha256:' + uuidv4().replace(/-/g, '');
  const perceptualHash = 'phash:' + uuidv4().replace(/-/g, '').substring(0, 16);
  
  return {
    contentHash,
    perceptualHash,
    mime: 'video/mp4',
    duration: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
    resolution: '1920x1080'
  };
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Create proof from URL
app.post('/v1/proofs', async (req, res) => {
  try {
    const { input, declared } = req.body;
    
    if (!input?.url) {
      return res.status(400).json({
        error: 'Missing required field: input.url'
      });
    }
    
    if (!declared?.generator || !declared?.prompt || !declared?.license) {
      return res.status(400).json({
        error: 'Missing required fields: declared.generator, declared.prompt, declared.license'
      });
    }
    
    console.log('Processing video URL:', input.url);
    console.log('Declared metadata:', declared);
    
    // Generate proof ID
    const proofId = generateProofId();
    
    // Process the video (simulate)
    const videoData = await processVideo(input.url, declared);
    
    // Store proof data
    proofs.set(proofId, {
      proofId,
      input,
      declared,
      videoData,
      createdAt: new Date().toISOString()
    });
    
    // Generate verification data
    const verificationData = {
      proofId,
      verdict: 'green', // Mock verdict
      contentHash: videoData.contentHash,
      mime: videoData.mime,
      duration: videoData.duration,
      resolution: videoData.resolution,
      declared,
      issuedAt: new Date().toISOString(),
      signatureStatus: 'valid'
    };
    
    verifications.set(proofId, verificationData);
    
    // Return response
    const response = {
      proofId,
      verifyUrl: `http://localhost:4200/t/${proofId}`,
      badgeUrl: `http://localhost:${PORT}/badges/${proofId}.png`
    };
    
    console.log('Proof created:', proofId);
    res.json(response);
    
  } catch (error) {
    console.error('Error creating proof:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Create proof from file upload
app.post('/v1/proofs/file', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const declared = JSON.parse(req.body.declared);
    
    if (!file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }
    
    if (!declared?.generator || !declared?.prompt || !declared?.license) {
      return res.status(400).json({
        error: 'Missing required fields: declared.generator, declared.prompt, declared.license'
      });
    }
    
    console.log('Processing uploaded file:', file.originalname);
    console.log('File size:', file.size, 'bytes');
    console.log('Declared metadata:', declared);
    
    // Generate proof ID
    const proofId = generateProofId();
    
    // Process the file (simulate)
    const videoData = await processVideo(file.buffer, declared);
    
    // Store proof data
    proofs.set(proofId, {
      proofId,
      input: { file: file.originalname, size: file.size },
      declared,
      videoData,
      createdAt: new Date().toISOString()
    });
    
    // Generate verification data
    const verificationData = {
      proofId,
      verdict: 'green', // Mock verdict
      contentHash: videoData.contentHash,
      mime: file.mimetype,
      duration: videoData.duration,
      resolution: videoData.resolution,
      declared,
      issuedAt: new Date().toISOString(),
      signatureStatus: 'valid'
    };
    
    verifications.set(proofId, verificationData);
    
    // Return response
    const response = {
      proofId,
      verifyUrl: `http://localhost:4200/t/${proofId}`,
      badgeUrl: `http://localhost:${PORT}/badges/${proofId}.png`
    };
    
    console.log('Proof created from file:', proofId);
    res.json(response);
    
  } catch (error) {
    console.error('Error creating proof from file:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get verification details
app.get('/v1/verify/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Fetching verification for:', id);
    
    const verification = verifications.get(id);
    
    if (!verification) {
      return res.status(404).json({
        error: 'Verification not found',
        proofId: id
      });
    }
    
    res.json(verification);
    
  } catch (error) {
    console.error('Error fetching verification:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Mock badge endpoint
app.get('/badges/:id.png', (req, res) => {
  const { id } = req.params;
  
  // Return a simple SVG badge
  const svg = `
    <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="60" fill="#22c55e" rx="8"/>
      <text x="100" y="35" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
        Verified by Truwit
      </text>
    </svg>
  `;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Truwit API server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /v1/proofs - Create proof from URL`);
  console.log(`   POST /v1/proofs/file - Create proof from file`);
  console.log(`   GET  /v1/verify/:id - Get verification details`);
  console.log(`   GET  /badges/:id.png - Get verification badge`);
  console.log(`\n🔗 CORS enabled for: http://localhost:4200, https://truwit.ai`);
});

module.exports = app;

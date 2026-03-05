import express from 'express';
import cors from 'cors';
import apiRoutes from './api-routes.js';
import path from 'path';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://life-vault-frontend.onrender.com',
    'https://life-vault-frontend-p200.onrender.com',
    'http://localhost:3000',
    'http://localhost:3003',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use('/api', apiRoutes);

// Root health check
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'life-vault-api',
    version: '1.0.0'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Life Vault API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Show current IST time
  const istTime = new Date(Date.now() + (5.5 * 60 * 60 * 1000));
  console.log(`Current IST time: ${istTime.toISOString().replace('Z', '+05:30')}`);
});

export default app;

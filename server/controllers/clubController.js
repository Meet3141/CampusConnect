import Club from "../models/Club.js";
import Membership from "../models/Membership.js";
const { body, query, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const redis = require('redis');
const client = redis.createClient();
const jwt = require('jsonwebtoken');
const tokenBlacklist = require('../middleware/tokenBlacklist');
const crypto = require('crypto');
const encryption = require('../middleware/encryption');
const express = require('express');
const { securityHeaders, cors } = require('./middleware/securityHeaders');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Apply security middleware
app.use(securityHeaders);
app.use(cors);
app.use(express.json());

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Import routes
const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');
const eventRoutes = require('./routes/events');
const messageRoutes = require('./routes/messages');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageRoutes);

module.exports = app;

// Encryption
ENCRYPTION_KEY=your-super-secret-encryption-key-min-32-chars

// CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://campusconnect.com

// Redis (for token blacklist)
REDIS_URL=redis://localhost:6379

// HTTPS
NODE_ENV=production
PORT=5000

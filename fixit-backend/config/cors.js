// config/cors.js - CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://localhost:4173', // Vite preview port
  'http://127.0.0.1:4173',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Log the origin for debugging
    console.log('CORS Origin received:', origin);
    console.log('Allowed origins:', allowedOrigins);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all localhost origins for development
    if (origin && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS Error: Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

module.exports = corsOptions;
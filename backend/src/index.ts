import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import { configurePassport } from './config/passport';
import { authRouter } from './routes/auth';
import { reposRouter } from './routes/repos';
import { changesRouter } from './routes/changes';
import { pullRequestsRouter } from './routes/pullRequests';
import { aiCommentsRouter } from './routes/aiComments';
import { fixableLinksRouter } from './routes/fixableLinks';
import { proxyRouter } from './routes/proxy';

// Load environment variables
const PORT = process.env.PORT || 3001;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Initialize Prisma
export const prisma = new PrismaClient();

// Create Express app
const app = express();

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow all origins in development
    return callback(null, origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
}));

// Handle preflight requests explicitly
app.options('*', cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Passport configuration
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/auth', authRouter);
app.use('/api/repos', reposRouter);
app.use('/api/changes', changesRouter);
app.use('/api/pull-requests', pullRequestsRouter);
app.use('/api/ai-comments', aiCommentsRouter);
app.use('/api/links', fixableLinksRouter);
app.use('/proxy', proxyRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to database');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();

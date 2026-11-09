import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import adminRoutes from './routes/admin.routes';
import studentRoutes from './routes/student.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*', // In production, specify: ['https://admin.examyemen.com', 'https://examyemen.com']
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    system: 'ExamYemen Central API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/student', studentRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار المطلوب غير موجود (Endpoint Not Found)',
  });
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'حدث خطأ غير متوقع في الخادم الداخلي',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ExamYemen Central API server running on: http://localhost:${PORT}`);
  console.log(`📡 Health Check endpoint: http://localhost:${PORT}/health`);
});

export default app;


import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AppError, errorHandler } from './middleware/errorHandler';
import routesV1 from './routes';
import { loggerMiddleware } from './middleware/logger';
import helmet from 'helmet';
import { config } from './config/variables.config';
import { apiLimiter } from './services/rateLimiter.service';

const app = express();

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    methods: ['GET', 'POST', 'DELETE', 'PUT','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'uid'],
    credentials: true,
  }),
);
app.use(express.json());
app.use(loggerMiddleware());

// Apply rate limiting to all routes
app.use('/api/v1', apiLimiter);

// TODO to be handle by ngix
app.use('/profiles', express.static(config.photoUploadPath, {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

app.use('/courses', express.static(config.coursePath, {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

app.use('/certificates', express.static(config.certificateStoragePath, {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Routes
app.use('/api/v1', routesV1);

// 404 handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404, true));
});

// Error handling
app.use(errorHandler);

export default app;

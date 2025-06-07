import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AppError, errorHandler } from './middleware/errorHandler';
import routesV1 from './routes';
import { loggerMiddleware } from './middleware/logger';
import helmet from 'helmet';
import { config } from './config/variables.config';
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

// TODO to be handle by ngix
app.use('/profiles', express.static(config.photoUploadPath));
app.use('/courses', express.static(config.coursePath));
app.use('/certificates', express.static(config.certificateStoragePath));

// Routes
app.use('/api/v1', routesV1);

// 404 handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404, true));
});

// Error handling
app.use(errorHandler);

export default app;

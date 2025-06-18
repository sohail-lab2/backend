// ../config/logger.ts
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { config } from '../config/variables.config';
import { RequestHandler } from 'express';

export const loggerMiddleware = (): RequestHandler => {
  if (config.nodeEnv === 'development') {
    return morgan('dev');
  }

  if (config.nodeEnv === 'production') {
    const logDirectory = path.join(__dirname, '../../logs');

    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }

    const logStream = fs.createWriteStream(
      path.join(logDirectory, 'access.log'),
      { flags: 'a' },
    );

    return morgan('combined', { stream: logStream });
  }

  return (_req, _res, next) => next();
};

/* eslint-disable @typescript-eslint/no-unused-vars */

import express, { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import { createServer } from 'http';
import passport from './middlewares/passport';
import { logger } from './utils/logger';
import './config/nodemailer';
import modules from './modules';
import { AppError } from './utils/app-error';
import i18nClient from './i18n';

import './cron/otpCleanup';
import WebSocketServer from './config/ws';

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(i18nClient.init);
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.xssFilter());
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);

app.use(passport.initialize());

app.use('/api', modules);
const server = createServer(app);
WebSocketServer.getInstance(server);

// Xử lý lỗi 404
app.use('*', () => {
  throw new AppError({
    id: 'app.middleware',
    message: 'API_NOTFOUND',
    statusCode: StatusCodes.NOT_FOUND,
  });
});

// Middleware xử lý lỗi toàn cục
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const language = req.headers['accept-language'] === 'en' ? 'en' : 'vi';

  if (err instanceof AppError) {
    err.translate(language);
    logger.error(`${err.message} - ${req.method} ${req.url} - ${req.ip}`);
    res.status(err.statusCode).json(err);
  } else {
    const error = new AppError({
      id: 'app.middleware.err',
      message: 'INTERNAL_SERVER_ERROR',
      detail: err.message,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });

    error.translate(language);
    res.status(error.statusCode).json(error);
    logger.error(`${error.message} - ${req.method} ${req.url} - ${req.ip}`);
  }
  next();
});

export default app;

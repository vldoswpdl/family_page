import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { dashboardRouter } from './routes/dashboardRoutes';

export const app = express();

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'onyu-page-backend'
  });
});

app.use('/api/dashboard', dashboardRouter);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({
    message: '서버 오류가 발생했습니다.'
  });
});


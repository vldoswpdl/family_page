import { Router } from 'express';
import { createDashboardSchedule, getDashboardData } from '../services/dashboardService';

export const dashboardRouter = Router();

dashboardRouter.get('/', async (req, res, next) => {
  try {
    const person = typeof req.query.person === 'string' ? req.query.person : undefined;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    const data = await getDashboardData(person, date);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

dashboardRouter.post('/schedules', async (req, res, next) => {
  try {
    const result = await createDashboardSchedule(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
      return;
    }

    next(error);
  }
});

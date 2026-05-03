import { Router } from 'express';
import { getDashboardData } from '../services/dashboardService';

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


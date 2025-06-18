import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRoles } from '../schemas';
import { getEnrollmentAnalytics, getSalesAnalytics } from '../controllers/analytics.controller';

const analyticsRouter = express.Router();

analyticsRouter.use(authenticate, authorize([UserRoles[3]]));
analyticsRouter.get('/sales', getSalesAnalytics);
analyticsRouter.get('/enrollement', getEnrollmentAnalytics);

export default analyticsRouter;

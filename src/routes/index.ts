import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import courseRoutes from './course.routes';
import quizRouter from './quiz.routes';
import certificateRouter from './certificate.routes';
import chapterRoutes from './chapter.routes';
import moduleRoutes from './module.routes';
import progressRoutes from './progress.routes';
import reviewRoutes from './review.routes';
import analyticsRouter from './analytics.routes';
import schoolRouter from './school.routes';
<<<<<<< HEAD
import contactRoutes from './contact.routes';
=======
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc

const routerV1 = Router();

routerV1.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

routerV1.use('/auth', authRoutes);
routerV1.use('/courses', courseRoutes);
routerV1.use('/analytics', analyticsRouter);
routerV1.use('/chapters', chapterRoutes);
routerV1.use('/modules', moduleRoutes);
routerV1.use('/progress', progressRoutes);
routerV1.use('/reviews', reviewRoutes);
routerV1.use('/quizzes', quizRouter);
routerV1.use('/certificates', certificateRouter);
routerV1.use('/schools', schoolRouter);
<<<<<<< HEAD
routerV1.use('/contact', contactRoutes);

export default routerV1;

=======

export default routerV1;
>>>>>>> df60681d70ae1bb524012301a45ca9880f84fbdc

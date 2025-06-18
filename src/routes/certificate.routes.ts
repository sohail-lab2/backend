import { Router } from 'express';
import {
  getAllCertificates,
  getCertificateById,
} from '../controllers/certificate.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRoles } from '../schemas';

const certificateRouter = Router();

certificateRouter.get('/:certId', getCertificateById);

certificateRouter.use(authenticate, authorize([UserRoles[0]]));
certificateRouter.get('/', getAllCertificates);

export default certificateRouter;

import { Router } from 'express';
import { newStudent, getUserDetail, createUser, updateUserDetails, updateStudentDetails, getAllUsers, deleteUser } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRoles } from '../schemas';
import { uploadProfilePhoto } from '../middleware/upload';

const authRouter: Router = Router();

authRouter.use(authenticate);

authRouter.post('/register', newStudent);
authRouter.get('/profile', getUserDetail)
        .patch('/profile', uploadProfilePhoto('photo'), updateUserDetails);

authRouter.use(authorize([UserRoles[2], UserRoles[3]]));
authRouter.get('/users', getAllUsers)
        .post('/users', createUser)
        .delete('/users', deleteUser)
        .patch('/users', updateStudentDetails);

export default authRouter;

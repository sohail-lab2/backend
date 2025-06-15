import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Certificate, User } from '../models';
import { cleanMongoData } from '../services';
import { AuthenticationError, NotFoundError } from '../middleware/errorHandler';
import { getCertificatesForUser } from '../services/certificate.service';

export const getAllCertificates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const mUser = await User.findOne({ uid: req.user?.uid }).lean();
        if(!mUser) throw new AuthenticationError();
        const certificates = await getCertificatesForUser(mUser._id.toString());
        if (!certificates || certificates.length === 0) {
            throw new NotFoundError('No certificates found');
        }
        res.status(200).json(cleanMongoData(certificates));
    } catch (error) {
        next(error);
    }
};

export const getCertificateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { certificateId } = req.params;

    try {
        const certificate = await Certificate.findById(certificateId).populate('user', 'name').populate('course', 'name description');
        if (!certificate) {
            throw new NotFoundError('Certificate not found');
        }
        res.status(200).json(certificate);
    } catch (error) {
        next(error);
    }
};

import { NextFunction, Request, Response } from 'express';
import { Chapter, Module, Course, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { cleanMongoData } from '../services/dataCleaner.service';
import { moduleValidationSchema, UserRoles } from '../schemas';
import { AppError, AuthorizationError, NotFoundError } from '../middleware/errorHandler';
import { Types } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Payment } from '../models';
import { config } from '../config/variables.config';

const isPermitted = async (req: AuthRequest, chapter: any) => {
    if (!req.user?.uid) throw new AuthorizationError();
    const mUser = await User.findOne({ uid: req.user.uid }).lean();
    if (!mUser) throw new AuthorizationError();
    // validation and access checking
    let mongoQuery:any = {
      _id: chapter.courseId,
    };
    if(mUser.role === UserRoles[1]){
      mongoQuery.instrID = mUser._id;
    }
    const course = await Course.findOne(mongoQuery).lean();
    if(!course) throw new AuthorizationError();
};

const cleanUploadPDF = async (req: AuthRequest) => {
  // 🧹 Clean up uploaded PDFs on error
  const files = req.files as Express.Multer.File[];
  if (files && files.length > 0) {
    for (const file of files) {
      try {
        fs.unlinkSync(path.resolve(file.path));
      } catch (err) {
        console.warn(`Failed to delete PDF: ${file.path}`, err);
      }
    }
  }
};

export const createModule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let moduleDetails = await moduleValidationSchema.parseAsync(req.body);
    //pdf(s) upload optional
    const files = req.files as Express.Multer.File[];
    if(files){
      moduleDetails.pdfs = files.map(file => `/courses/pdfs/${moduleDetails.chapterId}/${file.filename}`);
    }
    
    const chapter = await Chapter.findById(moduleDetails.chapterId);
    if (!chapter) {
      throw new NotFoundError('Chapter not found or not Authorized');
    }
    await isPermitted(req, chapter);

    const module = await Module.create(moduleDetails);
    // Update chapter with new module
    chapter.modules!.push(module._id as unknown as Types.ObjectId);
    await chapter.save();
    return res.status(201).json(cleanMongoData(module.toJSON()));
  } catch (error: any) {
    cleanUploadPDF(req);
    if (error.code === 11000) {
      return next(new AppError('Module order must be unique within a chapter', 400, true));
    }
    return next(error);
  }
};

export const getModuleById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.uid) throw new AuthorizationError();
    const mUser = await User.findOne({ uid: req.user.uid }).lean();
    if (!mUser) throw new AuthorizationError();
    
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    // Get chapter and course for access control
    const chapter = await Chapter.findById(module.chapterId);
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    
    if(mUser.role === UserRoles[1]){
      const course = await Course.findOne({instrID: mUser._id, _id: chapter.courseId}).lean();
      if(!course) throw new AuthorizationError();
    }else if(mUser.role === UserRoles[0]){
      const payment = await Payment.findOne({ userId: mUser._id, courseId: chapter.courseId }).lean();
      if (!payment) throw new NotFoundError("You have not purchased this course");
    }

    return res.json(cleanMongoData(module.toJSON()));
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching module' });
  }
};

export const getPublicModuleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const module = await Module.findById(req.params.id)
    .select('name description order');
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    return res.json(cleanMongoData(module.toJSON()));
  } catch (error) {
    return next(error);
  }
};
export const deleteModulePdfs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const chapter = await Chapter.findById(module.chapterId).lean();
    if (!chapter) {
      throw new NotFoundError('Chapter not found');
    }
    await isPermitted(req, chapter);

    const pdfsToDelete = req.body.pdfs;
    if (pdfsToDelete && pdfsToDelete.length > 0) {
      for (const pdf of pdfsToDelete) {
        const pdfPath = path.resolve(config.coursePath, 'pdfs', module.chapterId.toString(), pdf);
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
      }
      // Remove PDFs from module's pdfs list with the correct path
      const pdfsToDeleteWithPrefix = pdfsToDelete.map((pdf:String) => `/courses/pdfs/${module.chapterId}/${pdf}`);
      await Module.findByIdAndUpdate(req.params.id, { $pullAll: { pdfs: pdfsToDeleteWithPrefix } }, { new: true });
    }

    return res.status(200).json({ message: 'PDF(s) deleted successfully' });
  } catch (error) {
    return next(error);
  }
};


export const updateModule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    
    const module = await Module.findById(req.params.id).lean();
    if(!module){
      throw new NotFoundError("Module not found");
    }
    let moduleDetails = await moduleValidationSchema.partial().parseAsync(req.body);
    
    //pdf(s) upload optional
    const files = req.files as Express.Multer.File[];
    let newPDFS;
    if(files){
      newPDFS = files.map(file => `/courses/pdfs/${moduleDetails.chapterId}/${file.filename}`);
    }

    const chapter = await Chapter.findById(moduleDetails.chapterId).lean();
    if (!chapter) {
      throw new NotFoundError('Chapter not found or not Authorized');
    }
    await isPermitted(req, chapter);
    const updateModule = await Module.findByIdAndUpdate(req.params.id,
      { $set: moduleDetails, $addToSet: { pdfs: newPDFS } },
      {new: true, lean: true}
    )
    return res.status(200).json(cleanMongoData(updateModule!));
  } catch (error: any) {
    cleanUploadPDF(req);
    if (error.code === 11000) {
      return next(new AppError('Module order must be unique within a chapter', 400, true));
    }
    return next(error);
  }
};

export const deleteModule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {

    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    const chapter = await Chapter.findById(module.chapterId).lean();
    if (!chapter) {
      throw new NotFoundError('Chapter not found');
    }
    await isPermitted(req, chapter);

    //delete the pdfs
    if (module.pdfs && Array.isArray(module.pdfs)) {
      for (const pdfPath of module.pdfs) {
        try {
          fs.unlinkSync(path.resolve(pdfPath));
        } catch (err) {
          console.warn(`Failed to delete PDF: ${pdfPath}`, err);
        }
      }
    }

    // Remove module from chapter
    await Chapter.updateOne(
      { _id: module.chapterId },
      { $pull: { modules: module._id } }
    );
    // Delete module
    await module.deleteOne();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

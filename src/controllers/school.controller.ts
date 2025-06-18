import { Response, NextFunction } from 'express';
import { School } from '../models/school.model';
import { Course } from '../models/course.model';
import { NotFoundError, AppError } from '../middleware/errorHandler';
import { cleanMongoData } from '../services';
import { AuthRequest } from '../middleware/auth';

export const createSchool = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const existing = await School.findOne({ name });
    if (existing) throw new AppError('School already exists', 400, true);
    
    const school = await School.create({ name, coursesPricing: [] });
    res.status(201).json(cleanMongoData(school.toJSON()));
  } catch (error) {
    next(error);
  }
};

export const getSchools = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = req.query;
    const query: any = {};
    if(name && typeof name === 'string'){
      query.name = {$regex: name, $options: 'i'};
    }
    const schools = await School.find(query);
    res.status(200).json(cleanMongoData(schools.map(school => school.toJSON())));
  } catch (error) {
    next(error);
  }
};

export const deleteCoursePriceForSchool = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { schoolId, courseId } = req.params;
  
      const school = await School.findById(schoolId);
      if (!school) throw new NotFoundError('School not found');
  
      const originalLength = school.coursesPricing.length;
      school.coursesPricing = school.coursesPricing.filter(
        (cp) => cp.courseId.toString() !== courseId
      );
  
      if (school.coursesPricing.length === originalLength) {
        throw new NotFoundError('Course pricing entry not found');
      }
  
      await school.save();
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
  

export const addCoursePriceForSchool = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { schoolId } = req.params;
    const { courseId, price } = req.body;

    const course = await Course.findById(courseId);
    if (!course) throw new NotFoundError('Course not found');

    const school = await School.findById(schoolId);
    if (!school) throw new NotFoundError('School not found');

    const alreadySet = school.coursesPricing.find(
      cp => cp.courseId.toString() === courseId
    );
    if (alreadySet) {
      alreadySet.price = price;
    } else {
      school.coursesPricing.push({ courseId, price });
    }

    await school.save();
    res.status(200).json(cleanMongoData(school.toJSON()));
  } catch (error) {
    next(error);
  }
};

export const deleteSchool = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { schoolId } = req.params;
    const school = await School.findByIdAndDelete(schoolId);
    if (!school) throw new NotFoundError('School not found');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

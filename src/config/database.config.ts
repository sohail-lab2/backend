import mongoose from 'mongoose';
import { config } from './variables.config';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.dbUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

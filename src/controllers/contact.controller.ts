import { Request, Response } from 'express';
import axios from 'axios';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config/variables.config';

export const submitContactForm = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phoneNumber, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      throw new AppError('Missing required fields', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 400);
    }

    // Get Google Script URL and verification code from environment variables
    const scriptURL = config.googleScriptUrl;
    const verificationCode = config.googleScriptVerificationCode;
    
    if (!scriptURL || !verificationCode) {
      throw new AppError('Contact form service not configured', 500);
    }

    // Send data to Google Apps Script with verification code
    await axios.post(`${scriptURL}?verificationCode=${verificationCode}`, {
      firstName,
      lastName,
      email,
      phoneNumber,
      message
    });

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to send message', 500);
  }
}; 
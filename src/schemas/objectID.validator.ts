import { z } from "zod";
import mongoose from "mongoose";

export const objectIdValidator = (Model: mongoose.Model<any>, fieldName: string) => 
  z.string()
    .refine((id) => mongoose.Types.ObjectId.isValid(id), {
      message: `Invalid ${fieldName} format`,
    })
    .refine(
      async (id) => {
        const exists = await Model.exists({ _id: id });
        return Boolean(exists);
      },
      {
        message: `Can't find Record with ID`,
      }
    );

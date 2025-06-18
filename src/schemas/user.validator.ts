import { z } from 'zod';

export const UserRoles = ['STUDENT', 'INSTRUCTOR', 'COURSE-MANAGER', "ADMIN"] as const;
export type UserRole = (typeof UserRoles)[number];

export const baseUserValidationSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .trim(),
  photoUrl: z.string().optional(),
  contactNumber: z.string()
    .regex(/^(\+91|0)?[6-9]\d{9}$/, 'Invalid phone number format'),
});

export const createUserValidationSchema = baseUserValidationSchema.extend({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Passoword must be at least 6 characters'),
  role: z.enum(UserRoles, {
    required_error: 'Role is required',
    invalid_type_error: 'Invalid role',
  }),
});

const studentDetailsValidationSchema = z.object({
  schoolName: z.string().min(1, "School name is needed"),
  studentClass: z.string().min(1, "Class is needed"),
});

export const createStudentValidationSchema = createUserValidationSchema.merge(studentDetailsValidationSchema);

export const deleteStudentValidationSchema = z.object({
  profileUID: z.string().min(1, 'Profile UID is required'),
});

export const updateStudentValidationSchema = studentDetailsValidationSchema.merge(deleteStudentValidationSchema);

type CreateUser = z.infer<typeof createUserValidationSchema>;
type CreateStudent = z.infer<typeof createStudentValidationSchema>;

export type CreateUserInput = CreateUser | CreateStudent;
export type BaseUser = z.infer<typeof baseUserValidationSchema>;
export type UpdateStudent = z.infer<typeof updateStudentValidationSchema>;
export type DeleteStudent = z.infer<typeof deleteStudentValidationSchema>;

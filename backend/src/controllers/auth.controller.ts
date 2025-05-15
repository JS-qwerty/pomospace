import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../index';
import { hashPassword, comparePasswords, generateToken } from '../utils/auth.utils';
import { catchAsync } from '../utils/error.utils';

// Register a new user
export const register = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      settings: {
        create: {} // Create default settings
      }
    },
  });

  // Generate token
  const token = generateToken(user.id, user.email);

  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Return user without password
  return res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

// Login user
export const login = catchAsync(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Check password
  const isPasswordValid = await comparePasswords(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate token
  const token = generateToken(user.id, user.email);

  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Return user without password
  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

// Logout user
export const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
});

// Get current user
export const getCurrentUser = catchAsync(async (req: Request, res: Response) => {
  // User is attached to request in authentication middleware
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.status(200).json({ user });
}); 
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../index';
import { catchAsync } from '../utils/error.utils';

// Get user settings
export const getSettings = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Find user settings
  const settings = await prisma.settings.findUnique({
    where: { userId: req.user.id },
  });

  if (!settings) {
    // Create default settings if not found
    const newSettings = await prisma.settings.create({
      data: {
        userId: req.user.id,
      },
    });
    return res.status(200).json({ settings: newSettings });
  }

  return res.status(200).json({ settings });
});

// Update user settings
export const updateSettings = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    pomodoroMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    autoStartBreaks,
    autoStartPomodoros,
    darkMode,
    alarmSound,
    alarmVolume,
    tickingSound,
    tickingVolume,
    alarmRepeat,
  } = req.body;

  // Find and update settings
  const updatedSettings = await prisma.settings.upsert({
    where: { userId: req.user.id },
    update: {
      pomodoroMinutes: pomodoroMinutes !== undefined ? pomodoroMinutes : undefined,
      shortBreakMinutes: shortBreakMinutes !== undefined ? shortBreakMinutes : undefined,
      longBreakMinutes: longBreakMinutes !== undefined ? longBreakMinutes : undefined,
      autoStartBreaks: autoStartBreaks !== undefined ? autoStartBreaks : undefined,
      autoStartPomodoros: autoStartPomodoros !== undefined ? autoStartPomodoros : undefined,
      darkMode: darkMode !== undefined ? darkMode : undefined,
      alarmSound: alarmSound !== undefined ? alarmSound : undefined,
      alarmVolume: alarmVolume !== undefined ? alarmVolume : undefined,
      tickingSound: tickingSound !== undefined ? tickingSound : undefined,
      tickingVolume: tickingVolume !== undefined ? tickingVolume : undefined,
      alarmRepeat: alarmRepeat !== undefined ? alarmRepeat : undefined,
    },
    create: {
      userId: req.user.id,
      pomodoroMinutes: pomodoroMinutes || 25,
      shortBreakMinutes: shortBreakMinutes || 5,
      longBreakMinutes: longBreakMinutes || 15,
      autoStartBreaks: autoStartBreaks || false,
      autoStartPomodoros: autoStartPomodoros || false,
      darkMode: darkMode || false,
      alarmSound: alarmSound || 'kitchen',
      alarmVolume: alarmVolume || 50,
      tickingSound: tickingSound || 'none',
      tickingVolume: tickingVolume || 50,
      alarmRepeat: alarmRepeat || 1,
    },
  });

  return res.status(200).json({ settings: updatedSettings });
}); 
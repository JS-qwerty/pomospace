import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../index';
import { catchAsync } from '../utils/error.utils';

// Get task history with optional filtering
export const getTaskHistory = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { startDate, endDate, taskId } = req.query;

  // Build query filter
  const whereClause: any = {
    userId: req.user.id,
  };

  if (startDate && endDate) {
    whereClause.date = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string),
    };
  } else if (startDate) {
    whereClause.date = {
      gte: new Date(startDate as string),
    };
  } else if (endDate) {
    whereClause.date = {
      lte: new Date(endDate as string),
    };
  }

  if (taskId) {
    whereClause.taskId = taskId as string;
  }

  const history = await prisma.taskHistory.findMany({
    where: whereClause,
    orderBy: {
      date: 'desc',
    },
    include: {
      task: {
        select: {
          text: true,
          completed: true,
        },
      },
    },
  });

  return res.status(200).json({ history });
});

// Create a new history entry
export const createHistoryEntry = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { taskId, taskName, minutes, date } = req.body;

  // If taskId is provided, verify it belongs to the user
  if (taskId) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
  }

  // Create history entry
  const historyEntry = await prisma.taskHistory.create({
    data: {
      userId: req.user.id,
      taskId,
      taskName,
      minutes,
      date: date ? new Date(date) : new Date(),
    },
  });

  // If taskId is provided, increment completed pomodoros
  if (taskId) {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        completedPomodoros: {
          increment: 1,
        },
      },
    });
  }

  return res.status(201).json({ historyEntry });
}); 
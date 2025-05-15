import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../index';
import { catchAsync } from '../utils/error.utils';

// Get all tasks for a user
export const getTasks = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId: req.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.status(200).json({ tasks });
});

// Create a new task
export const createTask = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { text, estimatedPomodoros = 1 } = req.body;

  const task = await prisma.task.create({
    data: {
      userId: req.user.id,
      text,
      estimatedPomodoros,
    },
  });

  return res.status(201).json({ task });
});

// Update a task
export const updateTask = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { text, estimatedPomodoros } = req.body;

  // Check if task exists and belongs to user
  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!existingTask) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Update task
  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      text,
      estimatedPomodoros,
    },
  });

  return res.status(200).json({ task: updatedTask });
});

// Delete a task
export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;

  // Check if task exists and belongs to user
  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!existingTask) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Delete task
  await prisma.task.delete({
    where: { id },
  });

  return res.status(200).json({ message: 'Task deleted successfully' });
});

// Toggle task completion
export const toggleTaskCompletion = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;

  // Check if task exists and belongs to user
  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!existingTask) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Toggle completion status
  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      completed: !existingTask.completed,
    },
  });

  return res.status(200).json({ task: updatedTask });
});

// Increment completed pomodoros for a task
export const incrementTaskPomodoro = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { minutes = 25 } = req.body; // Default to 25 minutes

  // Check if task exists and belongs to user
  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!existingTask) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Increment pomodoro count
  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      completedPomodoros: {
        increment: 1,
      },
    },
  });

  // Add to task history
  await prisma.taskHistory.create({
    data: {
      userId: req.user.id,
      taskId: id,
      taskName: existingTask.text,
      minutes,
    },
  });

  return res.status(200).json({ task: updatedTask });
}); 
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../index';
import { catchAsync } from '../utils/error.utils';

// Helper function to get date range based on time range
const getDateRange = (timeRange: string) => {
  const now = new Date();
  let startDate: Date;
  const endDate = new Date(now);
  
  switch (timeRange) {
    case 'day':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      // Default to last 7 days
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
  }
  
  return { startDate, endDate };
};

// Get productivity summary
export const getSummary = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Get time range from query params
  const { timeRange = 'week', startDate: startDateParam, endDate: endDateParam } = req.query;
  
  let dateRange;
  if (startDateParam && endDateParam) {
    dateRange = {
      startDate: new Date(startDateParam as string),
      endDate: new Date(endDateParam as string),
    };
  } else {
    dateRange = getDateRange(timeRange as string);
  }

  // Get total focused minutes
  const totalFocusTime = await prisma.taskHistory.aggregate({
    _sum: {
      minutes: true,
    },
    where: {
      userId: req.user.id,
      date: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    },
  });

  // Get days active
  const activeDays = await prisma.taskHistory.groupBy({
    by: ['date'],
    where: {
      userId: req.user.id,
      date: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    },
  });

  // Get completed tasks
  const completedTasks = await prisma.task.count({
    where: {
      userId: req.user.id,
      completed: true,
      updatedAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    },
  });

  // Calculate streak (consecutive days with activity)
  const historyByDay = await prisma.taskHistory.groupBy({
    by: ['date'],
    where: {
      userId: req.user.id,
    },
    orderBy: {
      date: 'desc',
    },
  });

  let streak = 0;
  if (historyByDay.length > 0) {
    // Check if there's activity today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const mostRecent = new Date(historyByDay[0].date);
    mostRecent.setHours(0, 0, 0, 0);
    
    const isActiveToday = mostRecent.getTime() === today.getTime();
    
    if (isActiveToday) {
      streak = 1;
      const oneDayMillis = 24 * 60 * 60 * 1000;
      
      for (let i = 1; i < historyByDay.length; i++) {
        const current = new Date(historyByDay[i].date);
        current.setHours(0, 0, 0, 0);
        
        const prev = new Date(historyByDay[i - 1].date);
        prev.setHours(0, 0, 0, 0);
        
        // Check if dates are consecutive
        if (prev.getTime() - current.getTime() === oneDayMillis) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  return res.status(200).json({
    summary: {
      focusHours: Math.round((totalFocusTime._sum.minutes || 0) / 60 * 10) / 10, // Round to 1 decimal
      daysActive: activeDays.length,
      completedTasks,
      streak,
    },
  });
});

// Get focus time data for charts
export const getFocusTime = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Get time range from query params
  const { timeRange = 'week', startDate: startDateParam, endDate: endDateParam } = req.query;
  
  let dateRange;
  if (startDateParam && endDateParam) {
    dateRange = {
      startDate: new Date(startDateParam as string),
      endDate: new Date(endDateParam as string),
    };
  } else {
    dateRange = getDateRange(timeRange as string);
  }

  // Get focus time grouped by day
  const focusTimeByDay = await prisma.$queryRaw`
    SELECT 
      DATE(date) as day, 
      SUM(minutes) as totalMinutes
    FROM "TaskHistory"
    WHERE 
      "userId" = ${req.user.id} AND
      date >= ${dateRange.startDate} AND
      date <= ${dateRange.endDate}
    GROUP BY day
    ORDER BY day ASC
  `;

  // Get focus time by task
  const focusTimeByTask = await prisma.$queryRaw`
    SELECT 
      "taskName",
      SUM(minutes) as totalMinutes
    FROM "TaskHistory"
    WHERE 
      "userId" = ${req.user.id} AND
      date >= ${dateRange.startDate} AND
      date <= ${dateRange.endDate}
    GROUP BY "taskName"
    ORDER BY totalMinutes DESC
    LIMIT 5
  `;

  return res.status(200).json({
    focusTime: {
      byDay: focusTimeByDay,
      byTask: focusTimeByTask,
      timeRange: timeRange,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
  });
}); 
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  res.status(201).json({ 
    user: { 
      id: '1', 
      email: req.body.email, 
      name: req.body.name 
    } 
  });
});

app.post('/api/auth/login', (req, res) => {
  res.status(200).json({ 
    user: { 
      id: '1', 
      email: req.body.email, 
      name: 'User' 
    } 
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', (req, res) => {
  res.status(200).json({ 
    user: { 
      id: '1', 
      email: 'user@example.com', 
      name: 'User' 
    } 
  });
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  res.status(200).json({ 
    settings: {
      id: '1',
      userId: '1',
      pomodoroMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      darkMode: false,
      alarmSound: 'kitchen',
      alarmVolume: 50,
      tickingSound: 'none',
      tickingVolume: 50,
      alarmRepeat: 1
    } 
  });
});

app.put('/api/settings', (req, res) => {
  res.status(200).json({ 
    settings: {
      ...req.body,
      id: '1',
      userId: '1'
    } 
  });
});

// Task endpoints
const tasks = [
  {
    id: '1',
    userId: '1',
    text: 'Complete project documentation',
    completed: false,
    estimatedPomodoros: 4,
    completedPomodoros: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    userId: '1',
    text: 'Review code changes',
    completed: true,
    estimatedPomodoros: 2,
    completedPomodoros: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

app.get('/api/tasks', (req, res) => {
  res.status(200).json({ tasks });
});

app.post('/api/tasks', (req, res) => {
  const newTask = {
    id: Math.random().toString(36).substring(7),
    userId: '1',
    text: req.body.text,
    completed: false,
    estimatedPomodoros: req.body.estimatedPomodoros || 1,
    completedPomodoros: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  tasks.push(newTask);
  res.status(201).json({ task: newTask });
});

app.put('/api/tasks/:id', (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.status(200).json({ task: tasks[taskIndex] });
});

app.delete('/api/tasks/:id', (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  tasks.splice(taskIndex, 1);
  res.status(200).json({ message: 'Task deleted successfully' });
});

app.patch('/api/tasks/:id/toggle', (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    completed: !tasks[taskIndex].completed,
    updatedAt: new Date().toISOString()
  };
  
  res.status(200).json({ task: tasks[taskIndex] });
});

app.patch('/api/tasks/:id/pomodoro', (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    completedPomodoros: tasks[taskIndex].completedPomodoros + 1,
    updatedAt: new Date().toISOString()
  };
  
  res.status(200).json({ task: tasks[taskIndex] });
});

// History endpoints
const history = [
  {
    id: '1',
    userId: '1',
    taskId: '1',
    taskName: 'Complete project documentation',
    date: new Date().toISOString(),
    minutes: 25
  },
  {
    id: '2',
    userId: '1',
    taskId: '2',
    taskName: 'Review code changes',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    minutes: 50
  }
];

app.get('/api/history', (req, res) => {
  res.status(200).json({ history });
});

app.post('/api/history', (req, res) => {
  const newEntry = {
    id: Math.random().toString(36).substring(7),
    userId: '1',
    taskId: req.body.taskId,
    taskName: req.body.taskName,
    date: req.body.date || new Date().toISOString(),
    minutes: req.body.minutes
  };
  
  history.push(newEntry);
  res.status(201).json({ historyEntry: newEntry });
});

// Reports endpoints
app.get('/api/reports/summary', (req, res) => {
  res.status(200).json({
    summary: {
      focusHours: 7.5,
      daysActive: 5,
      completedTasks: 12,
      streak: 3
    }
  });
});

app.get('/api/reports/focus-time', (req, res) => {
  res.status(200).json({
    focusTime: {
      byDay: [
        { day: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], totalMinutes: 75 },
        { day: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], totalMinutes: 100 },
        { day: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], totalMinutes: 50 },
        { day: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], totalMinutes: 125 },
        { day: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], totalMinutes: 75 },
        { day: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], totalMinutes: 25 },
        { day: new Date().toISOString().split('T')[0], totalMinutes: 0 }
      ],
      byTask: [
        { taskName: 'Complete project documentation', totalMinutes: 150 },
        { taskName: 'Review code changes', totalMinutes: 100 },
        { taskName: 'Write tests', totalMinutes: 75 },
        { taskName: 'Fix bugs', totalMinutes: 50 },
        { taskName: 'Update dependencies', totalMinutes: 25 }
      ],
      timeRange: 'week',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test with: curl http://localhost:${PORT}/health`);
}); 
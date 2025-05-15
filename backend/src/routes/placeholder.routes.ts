import express, { Request, Response } from 'express';

// Create a placeholder router with basic endpoints
const createPlaceholderRouter = (routeName: string) => {
  const router = express.Router();
  
  router.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: `${routeName} API is working` });
  });
  
  router.post('/', (req: Request, res: Response) => {
    res.status(201).json({ message: `Created ${routeName} item`, data: req.body });
  });
  
  router.put('/:id', (req: Request, res: Response) => {
    res.status(200).json({ message: `Updated ${routeName} item ${req.params.id}`, data: req.body });
  });
  
  router.delete('/:id', (req: Request, res: Response) => {
    res.status(200).json({ message: `Deleted ${routeName} item ${req.params.id}` });
  });
  
  return router;
};

export default createPlaceholderRouter; 
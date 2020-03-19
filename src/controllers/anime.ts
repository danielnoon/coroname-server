import express from 'express';
import { response } from '../models/response';

const router = express.Router();

router.get('/search', (req, res) => {
  const query = req.query.q as string;

  res.send(response(0, { query }));
});

export default router;
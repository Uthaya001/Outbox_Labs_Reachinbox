import express from 'express';
import prisma from '../db';
import { suggestReply } from '../services/ai';
const router = express.Router();

router.get('/:id/suggest', async (req, res) => {
  const id = Number(req.params.id);
  const e = await prisma.email.findUnique({ where: { id }});
  if (!e) return res.status(404).json({ error: 'not found' });
  const suggestion = await suggestReply(e);
  res.json({ suggestion });
});

export default router;

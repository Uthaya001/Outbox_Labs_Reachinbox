import express from 'express';
import prisma from '../db';
import { miniSearch } from '../services/searchIndex';
const router = express.Router();

// Search using MiniSearch (falls back to DB when index empty)
router.get('/emails', async (req, res) => {
  const q = String(req.query.q || '');
  const account = String(req.query.account || '');
  const folder = String(req.query.folder || '');
  try {
    if (q) {
      const results = miniSearch.search(q, { prefix: true });
      // apply filters if provided
      const hits = results
        .map(r => r)
        .filter(r => (account ? r.accountEmail === account : true))
        .filter(r => (folder ? r.folder === folder : true));
      return res.json({ hits });
    }
    const where: any = {};
    if (account) where.accountEmail = account;
    if (folder) where.folder = folder;

    const rows = await prisma.email.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ hits: rows });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;

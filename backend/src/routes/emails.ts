import express from 'express';
import prisma from '../db';

const router = express.Router();

/**
 * GET /api/emails
 * → Fetch recent 50 emails
 */
router.get('/', async (_req, res) => {
  try {
    const emails = await prisma.email.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(emails);
  } catch (err) {
    console.error('Error fetching emails:', err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /api/emails/:id
 * → Fetch a single email by ID
 */
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    const email = await prisma.email.findUnique({ where: { id } });
    if (!email) return res.status(404).json({ error: 'Email not found' });
    res.json(email);
  } catch (err) {
    console.error('Error fetching email:', err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * POST /api/emails/markInterested/:id
 * → Mark an email as "Interested" and trigger Slack/Webhook
 */
router.post('/markInterested/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    const updatedEmail = await prisma.email.update({
      where: { id },
      data: { aiCategory: 'Interested' },
    });

    // Optional: Slack/Webhook integration hooks
    console.log(`🔔 Email ID ${id} marked as Interested`);
    res.json({
      message: 'Email marked as Interested',
      email: updatedEmail,
    });
  } catch (err) {
    console.error('Error marking email:', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;

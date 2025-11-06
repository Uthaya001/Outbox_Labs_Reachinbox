import express from 'express';
import prisma from '../db';
import bcrypt from "bcryptjs";



const router = express.Router();

router.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email & password required' });
  const hashed = await bcrypt.hash(password, 10);
  // Simple user creation in DB (you can extend schema)
  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashed }
    });
    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRouter from './routes/api';
import searchRouter from './routes/search';
import { startAllImap } from './imap/sync';
import { initSearch } from './services/searchIndex';
import emailsRouter from './routes/emails';

dotenv.config();

// ✅ Initialize express *before*
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Register routes *after* app is created
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: '✅ Backend is running successfully' });
});

app.use('/api', apiRouter);
app.use('/search', searchRouter);
app.use('/api/emails', emailsRouter); // ✅ moved below

// ✅ Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;

// ✅ Initialize search and IMAP sync, then start server
(async () => {
  await initSearch();
  app.listen(PORT, async () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    try {
      await startAllImap();
      console.log('📬 IMAP sync started (or mock running)');
    } catch (error) {
      console.error('IMAP start error:', error);
    }
  });
})();

export default app;

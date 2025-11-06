import prisma from '../db';
import { MiniSearchEmail, indexEmail } from '../services/searchIndex';
import { categorizeEmail, maybeNotifyInterested } from '../services/ai';

import dotenv from 'dotenv';
dotenv.config();

const USE_MOCK = process.env.USE_MOCK === 'true' || !process.env.IMAP_ENABLED;

export async function startAllImap() {
  if (USE_MOCK) {
    console.log('Starting mock IMAP generator (no IMAP credentials provided).');
    mockSeedAndStream();
    return;
  }

  // Real IMAP code (imapflow) - will run if IMAP_ENABLED=true and env vars are set
  const ImapFlow = require('imapflow').ImapFlow;
  const accounts = [];
  for (let i = 1; i <= 2; i++) {
    const prefix = `IMAP_ACCOUNT_${i}_`;
    const email = process.env[prefix + 'EMAIL'];
    if (!email) continue;
    accounts.push({
      email,
      host: process.env[prefix + 'HOST'],
      port: Number(process.env[prefix + 'PORT'] || 993),
      auth: {
        user: process.env[prefix + 'USER'],
        pass: process.env[prefix + 'PASS']
      }
    });
  }

  for (const acc of accounts) {
    startImapForAccount(acc).catch(e => console.error('IMAP error', e));
  }
}

async function startImapForAccount(acc: any) {
  const ImapFlow = require('imapflow').ImapFlow;
  const client = new ImapFlow({
    host: acc.host,
    port: acc.port,
    secure: true,
    auth: acc.auth
  });

  client.on('error', (err: any) => console.error('IMAP client error', err));

  await client.connect();
  console.log('IMAP connected for', acc.email);

  // Fetch last 30 days
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const lock = await client.getMailboxLock('INBOX');
  try {
    for await (let message of client.fetch({ since }, { envelope: true, source: true, uid: true })) {
      // parse envelope
      const msg = {
        accountEmail: acc.email,
        folder: 'INBOX',
        messageId: message.envelope?.messageId || `uid-${message.uid}`,
        from: (message.envelope?.from && message.envelope.from[0]?.address) || '',
        to: (message.envelope?.to && message.envelope.to[0]?.address) || '',
        subject: message.envelope?.subject || '',
        body: message.source?.toString() || '',
        date: message.envelope?.date || new Date()
      };
      await upsertEmail(msg);
    }
  } finally {
    lock.release();
  }

  // IDLE for real-time
  client.on('exists', async () => {
    // new mail arrived - fetch last message
    const seq = await client.fetch('1:*', { envelope: true, source: true, uid: true });
    for await (let message of seq) {
      const msg = {
        accountEmail: acc.email,
        folder: 'INBOX',
        messageId: message.envelope?.messageId || `uid-${message.uid}`,
        from: (message.envelope?.from && message.envelope.from[0]?.address) || '',
        to: (message.envelope?.to && message.envelope.to[0]?.address) || '',
        subject: message.envelope?.subject || '',
        body: message.source?.toString() || '',
        date: message.envelope?.date || new Date()
      };
      await upsertEmail(msg);
    }
  });
}

async function upsertEmail(msg: any) {
  try {
    const e = await prisma.email.upsert({
      where: { messageId: msg.messageId },
      create: {
        account: msg.accountEmail,
        folder: msg.folder,
        messageId: msg.messageId,
        from: msg.from,
        to: msg.to,
        subject: msg.subject,
        body: msg.body,
      },
      update: {}
    });
    // index in MiniSearch
    const mini: MiniSearchEmail = {
      id: e.id,
      accountEmail: e.account,
      folder: e.folder,
      subject: e.subject,
      fromAddress: e.from,
      body: e.body,
      createdAt: e.createdAt.toISOString()
    };
    indexEmail(mini);

    // AI categorize
    const category = await categorizeEmail(e);
    if (category) {
      await prisma.email.update({
        where: { id: e.id },
        data: { aiCategory: category }
      });
      // notify if Interested
      await maybeNotifyInterested(e, category);
    }
  } catch (err) {
    console.error('upsertEmail error', err);
  }
}

// Mock generator - creates initial emails + new emails every 10s
async function mockSeedAndStream() {
  const seed = [
    { from: 'alice@example.com', to: 'me@local', subject: 'Interested in product', body: 'I am interested. Please share meeting link.' },
    { from: 'bob@example.com', to: 'me@local', subject: 'Not a fit', body: 'Thanks but not interested.' },
    { from: 'carol@example.com', to: 'me@local', subject: 'Meeting booked', body: 'I booked the meeting at cal.com/example' }
  ];
  for (const s of seed) {
    const e = await prisma.email.create({
      data: {
        account: 'mock@local',
        folder: 'INBOX',
        messageId: 'mock-' + Math.random().toString(36).slice(2),
        from: s.from,
        to: s.to,
        subject: s.subject,
        body: s.body
      }
    });
    indexEmail({
      id: e.id,
      accountEmail: e.account,
      folder: e.folder,
      subject: e.subject,
      fromAddress: e.from,
      body: e.body,
      createdAt: e.createdAt.toISOString()
    });
    const category = await categorizeEmail(e);
    await prisma.email.update({ where: { id: e.id }, data: { aiCategory: category } });
    await maybeNotifyInterested(e, category);
  }

  // simulate continuing arrivals every 10s
  setInterval(async () => {
    const s = { from: 'newbuyer@example.com', to: 'me@local', subject: 'Interested - quick question', body: 'I am interested, when can we meet?' };
    const e = await prisma.email.create({
      data: {
        account: 'mock@local',
        folder: 'INBOX',
        messageId: 'mock-' + Math.random().toString(36).slice(2),
        from: s.from,
        to: s.to,
        subject: s.subject,
        body: s.body
      }
    });
    indexEmail({
      id: e.id,
      accountEmail: e.account,
      folder: e.folder,
      subject: e.subject,
      fromAddress: e.from,
      body: e.body,
      createdAt: e.createdAt.toISOString()
    });
    const category = await categorizeEmail(e);
    await prisma.email.update({ where: { id: e.id }, data: { aiCategory: category } });
    await maybeNotifyInterested(e, category);
    console.log('Mock new email created id=', e.id);
  }, 10000);
}

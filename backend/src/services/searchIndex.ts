import MiniSearch from 'minisearch';

export interface MiniSearchEmail {
  id: number;
  accountEmail: string;
  folder: string;
  subject: string;
  fromAddress: string;
  body: string;
  createdAt: string;
}

export let miniSearch: MiniSearch | null = null;

export async function initSearch() {
  miniSearch = new MiniSearch({
    fields: ['subject', 'body', 'fromAddress'],
    storeFields: ['subject', 'body', 'fromAddress', 'accountEmail', 'folder'],
  });
  console.log('MiniSearch initialized');
}

export function indexEmail(email: MiniSearchEmail) {
  if (!miniSearch) return;
  miniSearch.add({
    id: email.id,
    subject: email.subject,
    body: email.body,
    fromAddress: email.fromAddress,
    accountEmail: email.accountEmail,
    folder: email.folder
  });
}

// simple export for routes
export { miniSearch as minisearchInstance, miniSearch as miniSearch };

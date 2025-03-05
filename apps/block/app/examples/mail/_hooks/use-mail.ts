import { atom, useAtom } from 'jotai';

import type { EmailMessage } from '@/app/examples/mail/_data/data';

import { mails } from '@/app/examples/mail/_data/data';

interface MailState {
  selected: EmailMessage['id'] | null;
}

const mailStateAtom = atom<MailState>({
  selected: mails[0].id,
});

export function useMail(): [MailState, (update: MailState) => void] {
  return useAtom(mailStateAtom);
}

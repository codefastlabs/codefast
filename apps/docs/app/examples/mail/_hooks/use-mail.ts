import { type EmailMessage, mails } from '@/app/examples/mail/_data/data';
import { atom, useAtom } from 'jotai';

interface MailState {
  selected: EmailMessage['id'] | null;
}

const mailStateAtom = atom<MailState>({
  selected: mails[0].id,
});

export function useMail(): [MailState, (update: MailState) => void] {
  return useAtom(mailStateAtom);
}

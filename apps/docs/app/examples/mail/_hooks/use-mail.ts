import { atom, type SetterOrUpdater, useRecoilState } from 'recoil';
import { type EmailMessage, mails } from '@/app/examples/mail/_data/data';

interface MailState {
  selected: EmailMessage['id'] | null;
}

const mailStateAtom = atom<MailState>({
  key: 'mailStateAtom',
  default: {
    selected: mails[0].id,
  },
});

export function useMail(): [MailState, SetterOrUpdater<MailState>] {
  return useRecoilState(mailStateAtom);
}

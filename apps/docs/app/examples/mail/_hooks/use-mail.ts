import { atom, type SetStateAction, useAtom } from 'jotai';
import { type EmailMessage, mails } from '@/app/examples/mail/_data/data';

type SetAtom<Args extends unknown[], Result> = (...args: Args) => Result;

interface Config {
  selected: EmailMessage['id'] | null;
}

const configAtom = atom<Config>({
  selected: mails[0].id,
});

export function useMail(): [Config, SetAtom<[SetStateAction<Config>], void>] {
  return useAtom(configAtom);
}

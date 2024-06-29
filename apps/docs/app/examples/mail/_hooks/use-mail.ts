import { atom, useAtom, type SetStateAction } from 'jotai';
import { mails, type Mail } from '@/app/examples/mail/_data/data';

type SetAtom<Args extends unknown[], Result> = (...args: Args) => Result;

interface Config {
  selected: Mail['id'] | null;
}

const configAtom = atom<Config>({
  selected: mails[0].id,
});

export function useMail(): [Config, SetAtom<[SetStateAction<Config>], void>] {
  return useAtom(configAtom);
}

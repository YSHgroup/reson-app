import { atom } from "jotai";

export const usersAtom = atom<Array<any>>([]);
export const callStatusAtom = atom<string>('');

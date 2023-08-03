import { useMemo } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { v4 as uuidv4 } from "uuid";
import { DBState, IDB, useDBState } from "./DBState";
import type { Receipt } from "@/types/receipt";

function key(eventcode: string) {
  return `idb:receipts:${eventcode}`;
}

function eventcode(key: string) {
  return key.split(":")[2] as string;
}

type CreateReceipt = Pick<Receipt, "total" | "records">;

function createFetcher<A extends any[], R>(
  state: DBState,
  fn: (db: IDB, ...args: A) => Promise<R>,
): (...args: A) => Promise<R | undefined> {
  switch (state.type) {
    case "error":
      return async () => undefined;
    case "available":
      return async (...args: A) => fn(state.db, ...args);
    case "opening":
      return async (...args: A) => {
        const db = await state.promise;
        return fn(db, ...args);
      };
  }
}

async function fetchCreateReceipt(
  db: IDB,
  key: string,
  { arg }: { arg: CreateReceipt },
) {
  const receipt: Receipt = {
    id: uuidv4(),
    createdAt: new Date(),
    eventcode: eventcode(key),
    ...arg,
  };
  await db.add("receipts", receipt);

  return receipt;
}

export function useIDBCreateReceipt(eventcode: string) {
  const state = useDBState();
  const fetcher = useMemo(
    () => createFetcher(state, fetchCreateReceipt),
    [state],
  );
  return useSWRMutation(key(eventcode), fetcher);
}

async function fetchReceipts(db: IDB, key: string) {
  return db.getAllFromIndex("receipts", "eventcode", eventcode(key));
}

export function useIDBReceipts(eventcode: string) {
  const state = useDBState();
  const fetcher = useMemo(() => createFetcher(state, fetchReceipts), [state]);
  return useSWR(key(eventcode), fetcher);
}

async function fetchDeleteReceipts(
  db: IDB,
  _: string,
  { arg }: { arg: { id: string }[] },
) {
  const tx = db.transaction("receipts", "readwrite");
  const store = tx.objectStore("receipts");
  await Promise.all(arg.map(({ id }) => store.delete(id)));
  await tx.done;

  return [];
}

export function useIDBDeleteReceipts(eventcode: string) {
  const state = useDBState();
  const fetcher = useMemo(
    () => createFetcher(state, fetchDeleteReceipts),
    [state],
  );
  return useSWRMutation(key(eventcode), fetcher);
}

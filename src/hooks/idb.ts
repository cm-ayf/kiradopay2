import type { Receipt } from "@/types/receipt";
import { DBState, useDBState } from "./DBState";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

function key(eventcode: string) {
  return `idb:receipts:${eventcode}`;
}

function eventcode(key: string) {
  return key.split(":")[2] as string;
}

type CreateReceipt = Pick<Receipt, "total" | "records">;

function toCreateReceiptFetcher(state: DBState) {
  if (state.type === "available") {
    return async function fetcher(
      key: string,
      { arg }: { arg: CreateReceipt }
    ) {
      const receipt: Receipt = {
        id: uuidv4(),
        createdAt: new Date(),
        eventcode: eventcode(key),
        ...arg,
      };
      await state.db.add("receipts", receipt);

      return receipt;
    };
  } else {
    return async () => undefined;
  }
}

export function useIDBCreateReceipt(eventcode: string) {
  const state = useDBState();
  const fetcher = useMemo(() => toCreateReceiptFetcher(state), [state]);
  return useSWRMutation(key(eventcode), fetcher);
}

function toReceiptsFetcher(state: DBState) {
  if (state.type === "available") {
    return async function fetcher(key: string) {
      return state.db.getAllFromIndex("receipts", "eventcode", eventcode(key));
    };
  } else {
    return async () => undefined;
  }
}

export function useIDBReceipts(eventcode: string) {
  const state = useDBState();
  const fetcher = useMemo(() => toReceiptsFetcher(state), [state]);
  return useSWR(key(eventcode), fetcher);
}

function toDeleteReceiptsFetcher(state: DBState) {
  if (state.type === "available") {
    return async function fetcher(
      _: string,
      { arg }: { arg: { id: string }[] }
    ) {
      const tx = state.db.transaction("receipts", "readwrite");
      const store = tx.objectStore("receipts");
      await Promise.all(arg.map(({ id }) => store.delete(id)));
      await tx.done;

      return [];
    };
  } else {
    return async () => undefined;
  }
}

export function useIDBDeleteReceipts(eventcode: string) {
  const state = useDBState();
  const fetcher = useMemo(() => toDeleteReceiptsFetcher(state), [state]);
  return useSWRMutation(key(eventcode), fetcher);
}

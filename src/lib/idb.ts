import type { Receipt, Record } from "@/types/receipt";
import { DBSchema, IDBPDatabase, openDB } from "idb";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

interface DB extends DBSchema {
  receipts: {
    key: string;
    value: Receipt;
    indexes: {
      eventcode: string;
    };
  };
}

type Migration = (db: IDBPDatabase<DB>) => void;

const migrations: Migration[] = [
  (db) => {
    const receipts = db.createObjectStore("receipts", {
      keyPath: "id",
      autoIncrement: false,
    });
    receipts.createIndex("eventcode", "eventcode");
  },
];

export async function initializeDB() {
  return;
}

interface CreateReceipt {
  total: number;
  records: Record[];
}

const g: typeof global & { db?: IDBPDatabase<DB> } = global;

async function ensureDB() {
  return (g.db ??= await openDB<DB>("receipts", 1, {
    upgrade(db, oldVersion, newVersion) {
      if (newVersion) {
        migrations
          .slice(oldVersion, newVersion)
          .forEach((migration) => migration(db));
      }
    },
  }));
}

function key(eventcode: string) {
  return `idb:receipts:${eventcode}`;
}

function eventcode(key: string) {
  return key.split(":")[2] as string;
}

async function createReceipt(key: string, { arg }: { arg: CreateReceipt }) {
  const db = await ensureDB();
  const receipt: Receipt = {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    eventcode: eventcode(key),
    ...arg,
  };
  await db.add("receipts", receipt);

  return receipt;
}

export function useIDBCreateReceipt(eventcode: string) {
  return useSWRMutation(key(eventcode), createReceipt);
}

async function readReceipts(key: string) {
  const db = await ensureDB();
  return db.getAllFromIndex("receipts", "eventcode", eventcode(key));
}

export function useIDBReceipts(eventcode: string) {
  return useSWR(key(eventcode), readReceipts);
}

async function deleteReceipts(key: string) {
  const db = await ensureDB();
  const keys = await db.getAllKeysFromIndex(
    "receipts",
    "eventcode",
    eventcode(key)
  );

  const tx = db.transaction("receipts", "readwrite");
  const store = tx.objectStore("receipts");
  await Promise.all(keys.map((key) => store.delete(key)));
  await tx.done;

  return [];
}

export function useIDBDeleteReceipts(eventcode: string) {
  return useSWRMutation(key(eventcode), deleteReceipts);
}

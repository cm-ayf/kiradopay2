import type { Receipt, Record } from "@/types/receipt";
import { DBSchema, IDBPDatabase, openDB } from "idb";

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

export class IDB {
  private db?: IDBPDatabase<DB>;

  constructor() {}

  async ensureDB() {
    return (this.db ??= await openDB<DB>("receipts", 1, {
      upgrade(db, oldVersion, newVersion) {
        if (newVersion) {
          migrations
            .slice(oldVersion, newVersion)
            .forEach((migration) => migration(db));
        }
      },
    }));
  }

  async addReceipt(eventcode: string, total: number, records: Record[]) {
    const db = await this.ensureDB();
    const receipt = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      eventcode,
      total,
      records,
    };
    await db.add("receipts", receipt);

    return receipt;
  }

  async getReceipts(eventcode: string) {
    const db = await this.ensureDB();
    return db.getAllFromIndex("receipts", "eventcode", eventcode);
  }

  async deleteReceipts(eventcode: string) {
    const db = await this.ensureDB();
    const keys = await db.getAllKeysFromIndex(
      "receipts",
      "eventcode",
      eventcode
    );

    const tx = db.transaction("receipts", "readwrite");
    const store = tx.objectStore("receipts");
    await Promise.all(keys.map((key) => store.delete(key)));
    await tx.done;

    return [];
  }

  async deleteReceipt(id: string) {
    const db = await this.ensureDB();
    await db.delete("receipts", id);
  }
}

export const idb = new IDB();

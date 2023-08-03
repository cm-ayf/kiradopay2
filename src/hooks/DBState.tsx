"use client";

import { DBSchema, IDBPDatabase, openDB } from "idb";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Receipt } from "@/types/receipt";

interface DB extends DBSchema {
  receipts: {
    key: string;
    value: Receipt;
    indexes: {
      eventcode: string;
    };
  };
}

export type IDB = IDBPDatabase<DB>;

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

function upgrade(db: IDB, oldVersion: number, newVersion: number | null) {
  if (newVersion) {
    migrations
      .slice(oldVersion, newVersion)
      .forEach((migration) => migration(db));
  }
}

export type DBState =
  | { type: "available"; db: IDB }
  | { type: "opening"; promise: Promise<IDB> }
  | { type: "error"; error?: any };

const DBStateContext = createContext<DBState>({ type: "error" });

export function DBStateProvider({ children }: PropsWithChildren) {
  const [type, setType] = useState<DBState["type"]>("opening");
  const promise = useRef<Promise<IDB>>(
    openDB<DB>("receipts", migrations.length, {
      upgrade,
      terminated: () => setType("error"),
    }),
  );
  const db = useRef<IDB>();
  const error = useRef<any>();

  const state = useMemo<DBState>(() => {
    switch (type) {
      case "available":
        return { type, db: db.current! };
      case "opening":
        return { type, promise: promise.current };
      case "error":
        return { type, error: error.current };
    }
  }, [type]);

  useEffect(() => {
    promise.current.then(
      (d) => {
        setType("available");
        db.current = d;
      },
      (e) => {
        setType("error");
        error.current = e;
      },
    );
  }, []);

  return (
    <DBStateContext.Provider value={state}>{children}</DBStateContext.Provider>
  );
}

export function useDBState() {
  return useContext(DBStateContext);
}

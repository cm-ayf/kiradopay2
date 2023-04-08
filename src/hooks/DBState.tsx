import type { Receipt } from "@/types/receipt";
import { DBSchema, IDBPDatabase, openDB } from "idb";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface DB extends DBSchema {
  receipts: {
    key: string;
    value: Receipt;
    indexes: {
      eventcode: string;
    };
  };
}

type IDB = IDBPDatabase<DB>;

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
  | { type: "opening" | "error" };

interface DBStateContext {
  state: DBState;
  open: () => Promise<void>;
}

const DBStateContext = createContext<DBStateContext>({
  state: { type: "opening" },
  open: async () => {},
});

export function DBStateProvider({ children }: PropsWithChildren) {
  const [type, setType] = useState<DBState["type"]>("opening");
  const db = useRef<IDB>();

  const state = useMemo<DBState>(
    () => (type === "available" ? { type, db: db.current! } : { type }),
    [type]
  );

  const open = useCallback(async () => {
    try {
      db.current = await openDB<DB>("receipts", migrations.length, {
        upgrade,
        terminated: () => setType("error"),
      });
      setType("available");
    } catch (error) {
      setType("error");
    }
  }, []);

  useEffect(() => {
    if (state.type === "opening") open();
  }, [state, open]);

  return (
    <DBStateContext.Provider value={{ state, open }}>
      {children}
    </DBStateContext.Provider>
  );
}

export function useDBState() {
  const { state } = useContext(DBStateContext);
  return state;
}

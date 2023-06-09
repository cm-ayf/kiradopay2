import type { Static, TObject, TSchema, TString } from "@sinclair/typebox";
import { Scope } from "./user";

export type TParams = TObject<{ [param: string]: TString }>;

export interface Route {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  scopes?: Scope[];
  params?: TParams;
  body?: TSchema;
  response: TSchema;
}

export namespace Route {
  export type Params<R extends Route> = Static<
    R["params"] extends TParams ? R["params"] : TParams
  >;
  export type Body<R extends Route> = R["body"] extends TSchema
    ? Static<R["body"]>
    : null;
  export type Response<R extends Route> = Static<R["response"]>;
}

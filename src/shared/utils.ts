import type { Static, TSchema } from "@sinclair/typebox";
import { Errors } from "@sinclair/typebox/errors";

export function getISODateString(date: string | Date) {
  const [d] = new Date(date).toISOString().split("T");
  return d!;
}

// to avoid `new Function` in `TypeCompiler.Compile`
export function typeCheck<T extends TSchema>(
  schema: T,
  value: unknown,
): value is Static<T> {
  const errors = Errors(schema, [], value);
  return !errors.First();
}

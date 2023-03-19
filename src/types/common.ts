import { Type } from "@sinclair/typebox";
import { Format } from "@sinclair/typebox/format";

export const Code = Type.String({
  pattern: /^[a-z0-9-]+$/i.source,
  minLength: 4,
});
export const Name = Type.String({ minLength: 1 });
export const Date = Type.Union([
  Type.String({ format: "date-time" }),
  Type.Date(),
]);
export const Uri = Type.String({ format: "uri" });

Format.Set("date-time", (value) => isFinite(globalThis.Date.parse(value)));
Format.Set("uri", (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
});

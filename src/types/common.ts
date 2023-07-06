import { Type } from "@sinclair/typebox";
import { TypeSystem } from "@sinclair/typebox/system";

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
export const Calculator = Type.String({ format: "calculator" });

TypeSystem.Format("date-time", (value) => isFinite(global.Date.parse(value)));
TypeSystem.Format("uri", (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
});
TypeSystem.Format("calculator", (value) => {
  try {
    new Function("state", value);
    return true;
  } catch (error) {
    return false;
  }
});

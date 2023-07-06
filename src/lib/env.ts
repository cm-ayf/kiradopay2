import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

const schema = Type.Object({
  DISCORD_CLIENT_ID: Type.String(),
  DISCORD_CLIENT_SECRET: Type.String(),
  HOST: Type.String(),
  JWT_SECRET: Type.String(),
  DISCORD_GUILD_ID: Type.String(),
  DISCORD_ROLE_ID: Type.Optional(Type.String()),
});
const compiled = TypeCompiler.Compile(schema);
if (!compiled.Check(process.env)) {
  for (const error of compiled.Errors(process.env)) {
    console.error(error);
  }
  process.exit(1);
}

export const env = process.env;

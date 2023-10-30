import { Type } from "@sinclair/typebox";
import { Errors } from "@sinclair/typebox/errors";
import { typeCheck } from "@/shared/utils";

const schema = Type.Object({
  DISCORD_CLIENT_ID: Type.String(),
  DISCORD_CLIENT_SECRET: Type.String(),
  HOST: Type.String(),
  JWT_SECRET: Type.String(),
  DISCORD_GUILD_ID: Type.String(),
  DISCORD_READ_ROLE_ID: Type.Optional(Type.String()),
  DISCORD_REGISTER_ROLE_ID: Type.Optional(Type.String()),
  DISCORD_WRITE_ROLE_ID: Type.Optional(Type.String()),
});

if (!typeCheck(schema, process.env)) {
  for (const error of Errors(schema, [], process.env)) {
    console.error(error);
  }
  process.exit(1);
}

export const env = process.env;

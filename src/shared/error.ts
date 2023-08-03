import { Static, Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

const OAuth2ErrorCode = Type.Enum({
  unknown_guild: "unknown_guild",
  invalid_credentials: "invalid_credentials",
  invalid_request: "invalid_request",
  server_error: "server_error",
} as const);

type OAuth2ErrorCode = Static<typeof OAuth2ErrorCode>;

const typeCheckCode = TypeCompiler.Compile(OAuth2ErrorCode);

const OAuth2ErrorJson = Type.Object({
  error: Type.Optional(Type.String()),
  error_description: Type.Optional(Type.String()),
  code: OAuth2ErrorCode,
});

type OAuth2ErrorJson = Static<typeof OAuth2ErrorJson>;

const typeCheckJson = TypeCompiler.Compile(OAuth2ErrorJson);

export class OAuth2Error extends Error {
  static fromError(e: unknown) {
    if (e instanceof this) {
      return e;
    } else {
      return new this("server_error", undefined, { cause: e });
    }
  }

  static fromSearchParams(searchParams: URLSearchParams) {
    const description = searchParams.get("error_description") ?? undefined;
    const code = searchParams.get("code");
    if (typeCheckCode.Check(code)) {
      return new this(code, description);
    } else {
      return new this("server_error", description);
    }
  }

  static fromJSON(e: unknown) {
    if (typeCheckJson.Check(e)) {
      return new this(e.code, e.error_description);
    } else {
      return new this("server_error", undefined, { cause: e });
    }
  }

  constructor(
    public code: OAuth2ErrorCode,
    public description?: string,
    options?: ErrorOptions
  ) {
    super(description ?? code, options);
  }

  get status() {
    return this.code === "server_error" ? 500 : 400;
  }

  toJSON(): OAuth2ErrorJson {
    const error = {
      invalid_request: "invalid_request",
      invalid_credentials: "invalid_grant",
      unknown_guild: "invalid_grant",
      server_error: undefined,
    }[this.code];
    return {
      ...(error && { error }),
      ...(this.description && { error_description: this.description }),
      code: this.code,
    };
  }

  toRedirectURL() {
    const error = {
      invalid_request: "invalid_request",
      invalid_credentials: "access_denied",
      unknown_guild: "access_denied",
      server_error: "server_error",
    }[this.code];
    const searchParams = new URLSearchParams({
      error,
      ...(this.description && { error_description: this.description }),
      code: this.code,
    });
    return `/?${searchParams.toString()}`;
  }
}

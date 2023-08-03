export class OAuth2Error extends Error {
  static fromError(e: unknown) {
    if (e instanceof this) {
      return e;
    } else {
      return new this("server_error", undefined, { cause: e });
    }
  }

  constructor(
    public code:
      | "unknown_guild"
      | "invalid_credentials"
      | "invalid_request"
      | "server_error",
    public description?: string,
    options?: ErrorOptions
  ) {
    super(description ?? code, options);
  }

  get status() {
    return this.code === "server_error" ? 500 : 400;
  }

  toJSON() {
    const error = {
      invalid_request: "invalid_request",
      invalid_credentials: "invalid_grant",
      unknown_guild: "invalid_grant",
      server_error: undefined,
    }[this.code];
    return {
      error,
      error_description: this.description,
      code: this.code,
    };
  }

  toRedirectURL() {
    const searchParams = new URLSearchParams();
    const error = {
      invalid_request: "invalid_request",
      invalid_credentials: "access_denied",
      unknown_guild: "access_denied",
      server_error: "server_error",
    }[this.code];
    searchParams.append("error", error);
    if (this.description) {
      searchParams.append("error_description", this.description);
    }
    searchParams.append("code", this.code);
    return `/?${searchParams.toString()}`;
  }
}

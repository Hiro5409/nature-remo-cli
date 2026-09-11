export type CliErrorCode =
  | "API_ERROR"
  | "AUTH_REQUIRED"
  | "CREDENTIAL_STORE_ERROR"
  | "FORBIDDEN"
  | "INVALID_ARGUMENT"
  | "INVALID_RESPONSE"
  | "RATE_LIMITED"
  | "UNAUTHORIZED"
  | "UNEXPECTED";

export type NatureRemoErrorCode =
  | "API_ERROR"
  | "FORBIDDEN"
  | "INVALID_ARGUMENT"
  | "INVALID_RESPONSE"
  | "RATE_LIMITED"
  | "UNAUTHORIZED";

type NatureRemoErrorOptions = {
  cause?: unknown;
  code: NatureRemoErrorCode;
  status?: number;
};

export class NatureRemoError extends Error {
  readonly code: NatureRemoErrorCode;
  readonly status?: number;

  constructor(message: string, options: NatureRemoErrorOptions) {
    super(message, "cause" in options ? { cause: options.cause } : undefined);
    this.name = "NatureRemoError";
    this.code = options.code;
    this.status = options.status;
  }
}

export function invalidArgument(message: string): NatureRemoError {
  return new NatureRemoError(message, { code: "INVALID_ARGUMENT" });
}

type CliErrorOptions = {
  cause?: unknown;
  code: CliErrorCode;
  exitCode?: number;
  hint?: string;
};

export class CliError extends Error {
  readonly code: CliErrorCode;
  readonly exitCode: number;
  readonly hint?: string;

  constructor(message: string, options: CliErrorOptions) {
    super(message, "cause" in options ? { cause: options.cause } : undefined);
    this.name = "CliError";
    this.code = options.code;
    this.exitCode = options.exitCode ?? 1;
    this.hint = options.hint;
  }
}

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, options: { cause?: unknown; status?: number } = {}) {
    super(message, "cause" in options ? { cause: options.cause } : undefined);
    this.name = "ApiError";
    this.status = options.status;
  }
}

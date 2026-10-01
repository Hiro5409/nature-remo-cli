import { type BaseIssue, getDotPath, isValiError } from "valibot";

import { ApiError, NatureRemoError } from "../errors.ts";

function classifyApiError(error: ApiError): NatureRemoError {
  switch (error.status) {
    case 401:
      return new NatureRemoError("Nature Remo rejected the access token.", {
        cause: error,
        code: "UNAUTHORIZED",
        status: error.status,
      });
    case 403:
      return new NatureRemoError("The access token does not permit this operation.", {
        cause: error,
        code: "FORBIDDEN",
        status: error.status,
      });
    case 429:
      return new NatureRemoError("Nature Remo API rate limit exceeded.", {
        cause: error,
        code: "RATE_LIMITED",
        status: error.status,
      });
    case undefined:
    default:
      return new NatureRemoError(error.message, {
        cause: error,
        code: "API_ERROR",
        status: error.status,
      });
  }
}

const MAX_REPORTED_ISSUES = 3;

function describeIssues(issues: readonly BaseIssue<unknown>[]): string {
  const reported = issues.slice(0, MAX_REPORTED_ISSUES).map((issue) => {
    const path = getDotPath(issue);
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  const remaining = issues.length - reported.length;
  return remaining > 0 ? `${reported.join("; ")} (+${remaining} more)` : reported.join("; ");
}

export async function natureRemoRequest<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof NatureRemoError) throw error;
    if (error instanceof ApiError) throw classifyApiError(error);
    if (isValiError(error)) {
      throw new NatureRemoError(
        `Nature Remo API returned an unexpected response: ${describeIssues(error.issues)}`,
        { cause: error, code: "INVALID_RESPONSE" },
      );
    }
    throw new NatureRemoError("Nature Remo API request failed.", {
      cause: error,
      code: "API_ERROR",
    });
  }
}

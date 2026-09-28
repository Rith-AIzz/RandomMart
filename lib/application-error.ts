export class ApplicationError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 400,
    message = code,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export function toErrorResponse(cause: unknown) {
  if (cause instanceof ApplicationError) {
    return Response.json(
      { error: cause.code, message: cause.message },
      { status: cause.status },
    );
  }
  if (
    cause &&
    typeof cause === "object" &&
    "name" in cause &&
    cause.name === "ZodError"
  ) {
    return Response.json(
      {
        error: "INVALID_INPUT",
        message: "The submitted information is invalid.",
      },
      { status: 422 },
    );
  }
  console.error(
    "Request failed",
    cause instanceof Error
      ? { name: cause.name, message: cause.message }
      : cause,
  );
  return Response.json(
    {
      error: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    },
    { status: 500 },
  );
}

export function assertSameOrigin(request: Request, requireOrigin = false) {
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  if (!origin) {
    if (requireOrigin) {
      throw new ApplicationError(
        "MISSING_ORIGIN",
        403,
        "Origin header is required for this action.",
      );
    }
    return;
  }
  if (origin !== requestUrl.origin) {
    throw new ApplicationError(
      "INVALID_ORIGIN",
      403,
      "Cross-origin request rejected.",
    );
  }
}

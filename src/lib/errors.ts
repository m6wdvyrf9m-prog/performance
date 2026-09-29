export class AppError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "VALIDATION",
  ) {
    super(message);
  }
}

export function assertAllowed(condition: unknown, message = "You do not have permission to do that") {
  if (!condition) {
    throw new AppError(message, "FORBIDDEN");
  }
}

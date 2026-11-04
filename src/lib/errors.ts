/**
 * أخطاء موحّدة + تحويلها إلى استجابات HTTP
 */
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthorized: (msg = "غير مصرح") => new AppError(401, msg, "UNAUTHORIZED"),
  forbidden: (msg = "ممنوع") => new AppError(403, msg, "FORBIDDEN"),
  notFound: (msg = "غير موجود") => new AppError(404, msg, "NOT_FOUND"),
  validation: (msg: string, details?: unknown) => new AppError(400, msg, "VALIDATION_ERROR", details),
  rateLimited: (retryAfterSec: number) => new AppError(429, `تم تجاوز الحد — حاول بعد ${retryAfterSec} ثانية`, "RATE_LIMITED"),
  sandbox: (msg: string) => new AppError(502, msg, "SANDBOX_ERROR"),
  config: (msg: string) => new AppError(500, msg, "CONFIG_ERROR"),
};

export function toResponse(err: unknown): { status: number; body: Record<string, unknown> } {
  if (err instanceof AppError) {
    return { status: err.status, body: { error: err.message, code: err.code, details: err.details } };
  }
  if (err instanceof Error) {
    // zod
    if ("issues" in err) return { status: 400, body: { error: "خطأ في التحقق", code: "VALIDATION_ERROR", details: (err as unknown as { issues: unknown }).issues } };
    return { status: 500, body: { error: err.message, code: "INTERNAL" } };
  }
  return { status: 500, body: { error: "خطأ غير معروف", code: "UNKNOWN" } };
}

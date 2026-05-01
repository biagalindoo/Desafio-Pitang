export class AppError extends Error {
  public readonly statusCode: number;
  public readonly error: string;

  constructor(message: string, statusCode = 400, error = "Bad Request") {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
  }
}


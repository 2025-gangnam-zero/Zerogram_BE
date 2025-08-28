export class CustomAPIError extends Error {
  statusCode: number;
  code: string;
  type: "database" | "logic";

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_SERVER_ERROR",
    type: "database" | "logic" = "logic"
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.type = type;
  }
}

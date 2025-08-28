import { CustomAPIError } from "../errors";

export class BadRequestError extends CustomAPIError {
  constructor(
    message: string,
    code: string = "BAD_REQUEST",
    type: "logic" | "database" = "logic"
  ) {
    super(message, 400, code, type);
  }
}

export class UnauthorizedError extends CustomAPIError {
  constructor(
    message: string,
    code: string = "UNAUTHORIZED",
    type: "logic" | "database" = "logic"
  ) {
    super(message, 401, code, type);
  }
}

export class ForbiddenError extends CustomAPIError {
  constructor(
    message: string,
    code: string = "FORBIDDEN",
    type: "logic" | "database" = "logic"
  ) {
    super(message, 403, code, type);
  }
}

export class NotFoundError extends CustomAPIError {
  constructor(
    message: string,
    code: string = "NOT_FOUND",
    type: "logic" | "database" = "logic"
  ) {
    super(message, 404, code, type);
  }
}

export class ConflictError extends CustomAPIError {
  constructor(
    message: string,
    code: string = "CONFLICT",
    type: "logic" | "database" = "logic"
  ) {
    super(message, 409, code, type);
  }
}

export class GoneError extends CustomAPIError {
  constructor(
    message: string,
    code: string = "GONE",
    type: "logic" | "database" = "logic"
  ) {
    super(message, 410, code, type);
  }
}

export class UnprocessableEntityError extends CustomAPIError {
  constructor(
    message: string,
    code: string = "UNPROCESSABLE_ENTITY",
    type: "logic" | "database" = "logic"
  ) {
    super(message, 422, code, type);
  }
}

export class LockedError extends CustomAPIError {
  constructor(
    message: string,
    code: string = "LOCKED",
    type: "logic" | "database" = "logic"
  ) {
    super(message, 423, code, type);
  }
}

export class InternalServerError extends CustomAPIError {
  constructor(
    message: string,
    code: string = "INTERNAL_SERVER_ERROR",
    type: "logic" | "database" = "logic"
  ) {
    super(message, 500, code, type);
  }
}

export class ServiceUnavailableError extends CustomAPIError {
  constructor(
    message: string,
    code: string = "SERVICE_UNAVAILABLE",
    type: "logic" | "database" = "logic"
  ) {
    super(message, 503, code, type);
  }
}

export class GatewayTimeoutError extends CustomAPIError {
  constructor(
    message: string,
    code: string = "GATEWAY_TIMEOUT",
    type: "logic" | "database" = "logic"
  ) {
    super(message, 504, code, type);
  }
}

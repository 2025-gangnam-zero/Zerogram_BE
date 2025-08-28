import {
  BadRequestError,
  ConflictError,
  GatewayTimeoutError,
  ServiceUnavailableError,
  UnprocessableEntityError,
} from "./http-errors";

class MongoDBDuplicateKeyError extends ConflictError {
  constructor(
    message: string = "MongoDB Duplicate key error: 중복된 키가 존재합니다.",
    code: string = "DUPLICATE_KEY",
    type: "logic" | "database" = "database"
  ) {
    // 생성자에서 부모 클래스 호출
    super(message, code, type);
  }
}

class MongoDBValidationError extends UnprocessableEntityError {
  constructor(
    message: string = "MongoDB 스키마 유효성 검사 실패",
    code: string = "MONGODB_VALIDATION_ERROR",
    type: "logic" | "database" = "database"
  ) {
    super(message, code, type);
  }
}

class MongoDBCastError extends BadRequestError {
  constructor(
    message: string = "MongoDB 데이터 타입 변환 실패",
    code: string = "MONGODB_CAST_ERROR",
    type: "logic" | "database" = "database"
  ) {
    super(message, code, type);
  }
}

class MongoDBNetworkError extends ServiceUnavailableError {
  constructor(
    message: string = "MongoDB 서버 연결 실패",
    code: string = "MONGODB_NETWORK_ERROR",
    type: "logic" | "database" = "database"
  ) {
    super(message, code, type);
  }
}

class MongoDBTimeoutError extends GatewayTimeoutError {
  constructor(
    message: string = "MongoDB 요청 시간 초과",
    code: string = "MONGODB_TIMEOUT_ERROR",
    type: "logic" | "database" = "database"
  ) {
    super(message, code, type);
  }
}

export {
  MongoDBDuplicateKeyError, // 409
  MongoDBValidationError, // 422
  MongoDBCastError, // 400
  MongoDBNetworkError, // 503
  MongoDBTimeoutError, // 504
};

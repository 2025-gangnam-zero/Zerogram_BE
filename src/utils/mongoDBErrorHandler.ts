import {
  MongoDBCastError,
  MongoDBDuplicateKeyError,
  MongoDBNetworkError,
  MongoDBTimeoutError,
  MongoDBValidationError,
} from "../errors";

export const mongoDBErrorHandler = (method: string, error: any): never => {
  const errorLog = {
    method,
    message: error.message,
    stack: error.stack,
  };

  console.error(`[${method}] error: ${error.message}`, errorLog);

  // 중복된 키 값이 존재할 경우 처리
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0] || "key"; // 중복된 필드명 추출

    throw new MongoDBDuplicateKeyError(
      `Duplicate ${field} exists. (중복된 키 존재)`,
      `VALIDATION_ERROR`
    );
  }

  // MongoDB 유효성 검사 오류 처리
  if (error.name === "ValidationError") {
    const errorDetails: Record<string, string> = {};

    // 유효성 검사 실패한 필드와 오류 메시지 추출하여 errorDetails에 추가
    for (const field in error.errors) {
      if (error.errors.hasOwnProperty(field)) {
        const fieldError = error.errors[field];
        errorDetails[field] = fieldError.message || "Invalid value"; // 오류 메시지 기본값 설정
      }
    }

    throw new MongoDBValidationError(error.message, "MONGODB_VALIDATION_ERROR");
  }

  // MongoDB 데이터 타입 변환 오류 처리
  if (error.name === "CastError") {
    const errorDetails: Record<string, string> = {};

    // 잘못된 데이터 타입의 필드명과 해당 값을 errorDetails에 추가
    errorDetails[error.path] = error.value;

    throw new MongoDBCastError(
      "Invalid data type. (잘못된 데이터 타입)",
      "MONGODB_CAST_ERROR"
    );
  }

  // MongoDB 네트워크 연결 오류 처리
  if (error.message.includes("failed to connect")) {
    throw new MongoDBNetworkError(
      "Failed to connect to MongoDB server. (MongoDB 서버 연결 실패)",
      "MONGODB_NETWORK_ERROR"
    );
  }

  // MongoDB 타임아웃 오류 처리
  if (error.message.includes("timeout")) {
    throw new MongoDBTimeoutError(
      "MongoDB request timed out. (MongoDB 요청 시간 초과)",
      "MONGODB_TIMEOUT_ERROR"
    );
  }

  // 예상치 못한 오류는 그대로 던짐
  throw error;
};

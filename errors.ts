export enum ErrorCode {
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  RequestTimeout = 408,
  PreconditionFailed = 412,
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
}

export function getErrorMessage(errorCode: ErrorCode): string {
  switch (errorCode) {
    case ErrorCode.BadRequest:
      return "bad request";
    case ErrorCode.Unauthorized:
      return "unauthorized";
    case ErrorCode.Forbidden:
      return "forbidden";
    case ErrorCode.NotFound:
      return "not found";
    case ErrorCode.RequestTimeout:
      return "request timeout";
    case ErrorCode.PreconditionFailed:
      return "precondition failed";
    case ErrorCode.InternalServerError:
      return "internal server error";
    case ErrorCode.NotImplemented:
      return "not implemented";
    case ErrorCode.ServiceUnavailable:
      return "service unavailable";
  }
  return "";
}

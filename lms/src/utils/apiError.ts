import {ApiError} from '@/apis/types/common';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isApiError = (error: unknown): error is ApiError => {
  if (!isRecord(error)) return false;
  return typeof error.code === 'number';
};

export const getApiErrorCode = (error: unknown): string | undefined => {
  if (!isApiError(error) || !isRecord(error.details)) return undefined;
  return typeof error.details.code === 'string' ? error.details.code : undefined;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!isApiError(error)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }
  if (isRecord(error.details)) {
    if (typeof error.details.message === 'string' && error.details.message.trim()) {
      return error.details.message;
    }
    if (typeof error.details.messageEn === 'string' && error.details.messageEn.trim()) {
      return error.details.messageEn;
    }
  }
  return error.message || fallback;
};

/** Distinguishes the structured-name contract errors the API intentionally exposes. */
export const getStructuredNameWriteError = (error: unknown, fallback: string): string => {
  const code = getApiErrorCode(error);
  const detail = getApiErrorMessage(error, fallback);

  if (code === 'PARAM_MISSING') {
    return 'First name and last name are required.';
  }
  if (code === 'BAD_REQUEST' && detail.toLowerCase().includes('use firstname and lastname')) {
    return 'The request used an obsolete combined-name field. Refresh this page and try again.';
  }
  return detail;
};

export const isHttpStatus = (error: unknown, status: number): boolean =>
  isApiError(error) && error.code === status;

export const isNotFound = (error: unknown): boolean =>
  isHttpStatus(error, 404);

export const isMethodNotAllowed = (error: unknown): boolean =>
  isHttpStatus(error, 405);

export const isConflict = (error: unknown): boolean =>
  isHttpStatus(error, 409);

export const isTransportOrServerFailure = (error: unknown): boolean =>
  isApiError(error) && (error.code === 0 || error.code >= 500);

export const getHttpStatusDescription = (error: unknown): string | undefined => {
  if (!isApiError(error)) return undefined;
  switch (error.code) {
    case 404:
      return 'The requested resource was not found or is not available.';
    case 405:
      return 'The requested action is not supported for this resource.';
    case 409:
      return 'A conflict occurred. The resource may have been updated by another user.';
    case 500:
      return 'An unexpected server error occurred. Please try again later.';
    default:
      return undefined;
  }
};

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

export const isHttpStatus = (error: unknown, status: number): boolean =>
  isApiError(error) && error.code === status;

export const isTransportOrServerFailure = (error: unknown): boolean =>
  isApiError(error) && (error.code === 0 || error.code >= 500);

import {AUTH_ERROR_CODES} from '@/apis';
import {isApiError, isRecord} from '@/utils/apiError';

export const getLoginErrorKind = (error: unknown): 'credentials' | 'unavailable' | 'unexpected' => {
  const details = isApiError(error) && isRecord(error.details) ? error.details : undefined;
  const responseCode = typeof details?.code === 'string' ? details.code : undefined;

  if (responseCode === AUTH_ERROR_CODES.invalidCredentials) return 'credentials';
  if (
    responseCode === AUTH_ERROR_CODES.serviceUnavailable
    || (isApiError(error) && (error.code === 0 || error.code >= 500))
  ) {
    return 'unavailable';
  }
  return 'unexpected';
};

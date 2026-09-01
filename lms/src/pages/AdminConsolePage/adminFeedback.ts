import {getApiErrorCode, getApiErrorMessage, getStructuredNameWriteError, isConflict} from '@/utils/apiError';

const MANAGED_USER_FALLBACK = 'The server rejected the request without an explanation.';

/** Keeps privileged identity errors actionable without guessing at a backend domain code. */
export const getManagedUserCreateError = (error: unknown): string => {
  const detail = getApiErrorMessage(error, MANAGED_USER_FALLBACK);
  const errorCode = getApiErrorCode(error);

  if (errorCode === 'PARAM_MISSING' || errorCode === 'BAD_REQUEST') {
    return `Managed user was not created. ${getStructuredNameWriteError(error, detail)}`;
  }
  const conflictGuidance = isConflict(error)
    ? ' The email or generated username may already belong to an existing identity.'
    : '';

  return `Managed user was not created. ${detail}${conflictGuidance}`;
};

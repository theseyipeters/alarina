import { ApiError } from './api.ts'

export function errorMessage(err: unknown) {
  if (err instanceof ApiError) {
    return err.code === 'validation_error' ? 'Please check the details you entered.' : err.message
  }
  return 'Could not reach the server. Check your connection and try again.'
}

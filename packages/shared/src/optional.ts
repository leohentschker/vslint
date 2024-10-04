export type Option<T> =
  | { response: T; error: null }
  | { response: null; error: Error };
export const Ok = <T>(response: T): Option<T> => ({ response, error: null });
export const Failure = (error: unknown) => ({
  response: null,
  error: error as Error,
});

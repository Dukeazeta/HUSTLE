function isTransientConnectionError(error: unknown) {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth++) {
    if (current instanceof Error) {
      const code = "code" in current ? String(current.code) : "";
      if (
        /fetch failed|connect timeout|UND_ERR_CONNECT_TIMEOUT|ECONNRESET|ETIMEDOUT/i.test(
          `${current.message} ${code}`,
        )
      )
        return true;
      current = current.cause;
    } else break;
  }
  return false;
}

export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  attempts = 2,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientConnectionError(error) || attempt === attempts)
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  throw lastError;
}

import { useCallback, useState } from 'react';

export function useSaveFeedback() {
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const run = useCallback(async <T,>(action: () => Promise<T>, successMessage = 'Збережено') => {
    setError('');
    setOk('');
    setBusy(true);
    try {
      const result = await action();
      setOk(successMessage);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
      throw err;
    } finally {
      setBusy(false);
    }
  }, []);

  return { error, setError, ok, setOk, busy, run };
}

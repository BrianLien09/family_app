'use client';

import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';

export function useFormSubmission(onClose: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pendingRef = useRef(false);

  const close = useCallback(() => {
    if (!pendingRef.current) onClose();
  }, [onClose]);

  const submit = async (save: () => Promise<boolean>, closeOnSuccess: boolean = true): Promise<boolean> => {
    if (pendingRef.current) return false;
    pendingRef.current = true;
    setIsSubmitting(true);
    let saved = false;
    try {
      saved = await save();
    } catch (error) {
      console.error('表單儲存失敗：', error);
      toast.error('儲存失敗，請稍後重試');
    } finally {
      pendingRef.current = false;
      setIsSubmitting(false);
    }
    if (saved && closeOnSuccess) onClose();
    return saved;
  };

  return { isSubmitting, submit, close };
}

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 类型安全的 localStorage Hook，内置 SSR/Hydration 安全处理。
 * 服务端渲染时始终使用 initialValue，客户端挂载后才读取 localStorage。
 *
 * @returns [value, setValue, removeValue, isMounted]
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  const [isMounted, setIsMounted] = useState(false);
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // 客户端挂载后读取 localStorage，避免 hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (err) {
      console.warn(`[useLocalStorage] 读取 "${key}" 失败:`, err);
    }
  }, [key]);

  // 写入：同时更新 state 和 localStorage（用函数式更新避免闭包过时问题）
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch (err) {
          console.warn(`[useLocalStorage] 写入 "${key}" 失败:`, err);
        }
        return next;
      });
    },
    [key]
  );

  // 删除：重置为初始值并移除 localStorage 条目
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[useLocalStorage] 删除 "${key}" 失败:`, err);
    }
    setStoredValue(initialValue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue, removeValue, isMounted];
}

export default useLocalStorage;

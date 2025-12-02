'use client';
import { useState, useEffect } from 'react';

export interface Settings {
  phone?: string;
  email?: string;
  address?: string;
  prices?: Array<{
    id: string;
    name: string;
    price: number;
    materials: number;
  }>;
}

// Глобальный кэш для избежания множественных запросов
let settingsCache: Settings | null = null;
let settingsPromise: Promise<Settings> | null = null;

async function fetchSettings(): Promise<Settings> {
  if (settingsCache) return settingsCache;
  
  if (!settingsPromise) {
    settingsPromise = fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        settingsCache = data;
        return data;
      })
      .catch(() => ({}));
  }
  
  return settingsPromise;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(settingsCache);
  const [isLoading, setIsLoading] = useState(!settingsCache);

  useEffect(() => {
    if (settingsCache) {
      setSettings(settingsCache);
      setIsLoading(false);
      return;
    }

    fetchSettings().then(data => {
      setSettings(data);
      setIsLoading(false);
    });
  }, []);

  return { settings, isLoading };
}

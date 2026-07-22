import { useEffect, useMemo } from 'react';
import { useGuestSettings } from '../storage/guestSettings';
import { translations } from './translations';

type TranslationTree = Record<string, unknown>;

function readKey(tree: TranslationTree, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as TranslationTree)[part];
  }, tree);

  return typeof value === 'string' ? value : undefined;
}

export function useI18n() {
  const settings = useGuestSettings();
  const language = settings.language;

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return useMemo(() => {
    function t(key: string) {
      const value = readKey(translations[language], key) ?? readKey(translations.ru, key);

      if (!value) {
        console.warn(`[i18n] Missing translation key: ${key}`);
      }

      return value ?? key;
    }

    return { language, t };
  }, [language]);
}

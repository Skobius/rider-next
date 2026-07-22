import type { GuestLanguage } from '../storage/guestSettings';

export interface LocalizedText {
  ru: string;
  en?: string;
}

export function getLocalizedText(value: LocalizedText, language: GuestLanguage) {
  const text = value[language] || value.ru;

  if (!value[language] && language !== 'ru') {
    console.warn('[i18n] Missing localized data value', value);
  }

  return text;
}

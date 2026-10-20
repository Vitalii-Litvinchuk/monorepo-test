'use client';

import { useAppDispatch, useAppSelector } from '../store';
import { setLanguage, Language } from '../store/slices/ui-slice';
import { ru } from './locales/ru';
import { ua } from './locales/ua';
import { en } from './locales/en';
import { Translations } from './types';

export * from './types';

export const dictionaries: Record<Language, Translations> = {
  ru,
  ua,
  en,
};

export function getTranslations(lang: Language): Translations {
  return dictionaries[lang] || dictionaries.ru;
}

export function formatProductType(type: string | undefined, lang: Language = 'ua'): string {
  if (!type) return '';
  const trimmed = type.trim();
  const lower = trimmed.toLowerCase();
  const currentDict = dictionaries[lang] || dictionaries.ua;

  // 1. Direct match with canonical key in current language
  if (currentDict.products?.typesList?.[lower]) {
    return currentDict.products.typesList[lower];
  }

  // 2. Direct match with translated value in current language
  if (currentDict.products?.typesList) {
    for (const [, val] of Object.entries(currentDict.products.typesList)) {
      if (val.toLowerCase() === lower) {
        return val;
      }
    }
  }

  // 3. Match across any other language dictionaries (e.g. input is 'Мониторы' or 'Monitors', current is 'ua')
  for (const [, dict] of Object.entries(dictionaries)) {
    if (dict.products?.typesList) {
      for (const [canonicalKey, translatedVal] of Object.entries(dict.products.typesList)) {
        if (translatedVal.toLowerCase() === lower || canonicalKey.toLowerCase() === lower) {
          return currentDict.products.typesList[canonicalKey] || trimmed;
        }
      }
    }
  }

  return trimmed;
}

export function useTranslation() {
  const dispatch = useAppDispatch();
  const currentLang = useAppSelector((state) => state.ui.language) || 'ru';
  const t = getTranslations(currentLang);

  const changeLanguage = (lang: Language) => {
    dispatch(setLanguage(lang));
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'ua' ? 'uk' : lang;
    }
  };

  const formatNumber = (num: number): string => {
    const localeMap: Record<Language, string> = {
      ru: 'ru-RU',
      ua: 'uk-UA',
      en: 'en-US',
    };
    return num.toLocaleString(localeMap[currentLang] || 'ru-RU', {
      minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

  const formatDayOfWeek = (date: Date): string => {
    const days = t.topMenu.daysOfWeek;
    return days[date.getDay()] || '';
  };

  const formatDateShort = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day} / ${month}`;
  };

  const formatDateFull = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const monthName = t.topMenu.months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} / ${monthName} / ${year}`;
  };

  const formatTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDateGeneral = (date: Date | string | null): string => {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day} / ${month} / ${year}`;
  };

  return {
    t,
    currentLang,
    changeLanguage,
    formatNumber,
    formatDayOfWeek,
    formatDateShort,
    formatDateFull,
    formatTime,
    formatDateGeneral,
    formatProductType: (type: string | undefined) => formatProductType(type, currentLang),
  };
}

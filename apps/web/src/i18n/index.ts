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
  };
}

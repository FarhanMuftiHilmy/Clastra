import React, { createContext, useContext, useEffect, useState } from 'react';
import { getLocale, Locale, setLocale } from './i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  localeJustChanged: boolean;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  localeJustChanged: false,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getLocale());
  const [localeJustChanged, setLocaleJustChanged] = useState(false);

  // Initialize transient flag from localStorage if present (persisted across reloads)
  useEffect(() => {
    const persisted = localStorage.getItem('app.localeJustChanged');
    if (persisted) {
      setLocaleJustChanged(true);
      localStorage.removeItem('app.localeJustChanged');
      const tmoInit = setTimeout(() => setLocaleJustChanged(false), 1400);
      return () => clearTimeout(tmoInit);
    }
    return;
  }, []);

  useEffect(() => {
    setLocale(locale);
    // persist a short-lived flag so UI can show confirmation even across reloads
    try {
      localStorage.setItem('app.localeJustChanged', '1');
    } catch (e) {
      // ignore storage errors in restricted environments
    }
    setLocaleJustChanged(true);
    const tmo = setTimeout(() => {
      setLocaleJustChanged(false);
      try {
        localStorage.removeItem('app.localeJustChanged');
      } catch (e) {}
    }, 1400);
    return () => clearTimeout(tmo);
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale: setLocaleState, localeJustChanged }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

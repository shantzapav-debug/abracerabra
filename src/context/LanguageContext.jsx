import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { I18N, LANG_KEY, SUPPORTED_LANGS, isSupportedLang } from '../i18n/translations';

const LanguageContext = createContext(null);

function readStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && isSupportedLang(stored)) return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  const setLang = useCallback((next) => {
    if (!isSupportedLang(next)) return;
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const raw = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
      if (!vars || typeof raw !== 'string') return raw;
      return Object.entries(vars).reduce(
        (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
        raw,
      );
    },
    [lang],
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', lang === 'ar');
    const description = I18N[lang]?.['meta.description'];
    const meta = document.querySelector('meta[name="description"]');
    if (description && meta) meta.setAttribute('content', description);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, langs: SUPPORTED_LANGS }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

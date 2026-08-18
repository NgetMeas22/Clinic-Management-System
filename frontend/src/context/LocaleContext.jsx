import { createContext, useContext, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { translations } from "../i18n/translations";
import {
  localizedPath as localizePath,
  detectLocaleFromPath,
} from "../utils/localizedPath";

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const locale = detectLocaleFromPath(location.pathname);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key, vars = {}) => {
      let value = translations[locale]?.[key] ?? translations.en?.[key] ?? key;
      Object.entries(vars).forEach(([name, val]) => {
        value = String(value).replace(`{${name}}`, String(val ?? ""));
      });
      return value;
    },
    [locale]
  );

  const setLocale = useCallback(
    (nextLocale) => {
      if (nextLocale === locale) return;
      navigate(localizePath(location.pathname, nextLocale));
    },
    [locale, location.pathname, navigate]
  );

  const localizedPath = useCallback(
    (path, targetLocale = locale) => localizePath(path, targetLocale),
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale, localizedPath }}>
      {children}
    </LocaleContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLocale = () => useContext(LocaleContext);

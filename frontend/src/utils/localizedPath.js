const EN_PREFIX = "/en";

export function localizedPath(path, locale) {
  if (!path) return path;

  const hasEnPrefix =
    path === EN_PREFIX ||
    path.startsWith(`${EN_PREFIX}/`) ||
    path.startsWith(`${EN_PREFIX}?`);

  if (locale === "en") {
    if (hasEnPrefix) return path;
    if (path === "/") return EN_PREFIX;
    return `${EN_PREFIX}${path}`;
  }

  return hasEnPrefix ? path.replace(EN_PREFIX, "") || "/" : path;
}

export function detectLocaleFromPath(pathname) {
  return pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`)
    ? "en"
    : "km";
}

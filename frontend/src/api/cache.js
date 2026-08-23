import api from "./axios";

const DEFAULT_TTL = 30000;

const cache = new Map();
const inflight = new Map();

const buildKey = (url, params) => `${url}?${JSON.stringify(params ?? {})}`;

export async function cachedGet(url, config = {}, ttlMs = DEFAULT_TTL) {
  const key = buildKey(url, config.params);

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return hit.value;
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = api
    .get(url, config)
    .then((value) => {
      cache.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

export function invalidateCache(prefixes = []) {
  if (!prefixes.length) {
    cache.clear();
    return;
  }
  for (const key of [...cache.keys()]) {
    if (prefixes.some((p) => key.startsWith(p))) cache.delete(key);
  }
}

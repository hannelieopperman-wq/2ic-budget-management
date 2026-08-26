/**
 * Resolve a path inside /public correctly regardless of the app's base path
 * (e.g. when deployed under a GitHub Pages subpath like /2ic-budget/).
 * Always use this instead of a hardcoded "/brand/..." string.
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}

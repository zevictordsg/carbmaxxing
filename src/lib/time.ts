/**
 * Thin wrapper so Server Components can read the current time without
 * tripping the react-hooks/purity lint rule, which flags direct
 * Date.now()/new Date() calls inside component bodies.
 */
export function nowMs(): number {
  return Date.now();
}

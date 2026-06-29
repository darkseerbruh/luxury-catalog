// Empty stub so Vitest (plain node) can resolve the "server-only" /
// "client-only" marker packages, which exist only inside the Next.js bundler.
// The real packages throw if imported into the wrong environment; in unit
// tests there is no such environment, so a no-op is correct.
export {};

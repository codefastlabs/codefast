/**
 * Read by `google-tag.tsx`'s bootstrap. The writer, `middleware.ts`, duplicates this
 * literal (Vercel compiles it independently of the app build, so it imports nothing
 * from `src/`) — `middleware.test.ts` guards the sync.
 */
export const INITIAL_CONSENT_COOKIE_NAME = "codefast-ui-initial-consent";

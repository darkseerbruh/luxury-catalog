/**
 * localStorage key holding a logged-out visitor's quiz answers until they create
 * an account. Kept in its own module so both the quiz (writer) and the post-login
 * flusher (reader) can share it without importing each other's component code.
 */
export const PENDING_QUIZ_KEY = "lc_pending_quiz";

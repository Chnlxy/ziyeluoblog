CREATE TABLE IF NOT EXISTS guestbook_messages (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  website TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'hidden')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  approved_at TEXT,
  rate_key TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS guestbook_messages_status_created_idx
  ON guestbook_messages (status, created_at DESC);

CREATE INDEX IF NOT EXISTS guestbook_messages_rate_key_created_idx
  ON guestbook_messages (rate_key, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_login_failures (
  id TEXT PRIMARY KEY,
  rate_key TEXT NOT NULL,
  failed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_login_failures_rate_key_failed_idx
  ON admin_login_failures (rate_key, failed_at DESC);

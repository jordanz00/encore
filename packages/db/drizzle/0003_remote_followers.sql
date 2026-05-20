CREATE TABLE IF NOT EXISTS "remote_followers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "artist_id" uuid NOT NULL REFERENCES "artists"("id") ON DELETE CASCADE,
  "follower_actor_iri" text NOT NULL,
  "follower_inbox_url" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "remote_followers_artist_actor_uq"
  ON "remote_followers" ("artist_id", "follower_actor_iri");

CREATE INDEX IF NOT EXISTS "remote_followers_artist_idx"
  ON "remote_followers" ("artist_id");

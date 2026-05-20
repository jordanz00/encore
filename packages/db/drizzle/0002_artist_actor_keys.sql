ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "actor_public_key_pem" text;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "actor_private_key_pem" text;

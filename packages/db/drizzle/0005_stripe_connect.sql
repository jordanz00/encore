ALTER TABLE "artist_wallets" ADD COLUMN IF NOT EXISTS "stripe_connect_account_id" varchar(64);
ALTER TABLE "artist_wallets" ADD COLUMN IF NOT EXISTS "stripe_connect_status" varchar(24) DEFAULT 'not_started' NOT NULL;
ALTER TABLE "artist_wallets" ADD COLUMN IF NOT EXISTS "stripe_charges_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "artist_wallets" ADD COLUMN IF NOT EXISTS "stripe_payouts_enabled" boolean DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS "artist_wallets_stripe_account_idx"
  ON "artist_wallets" ("stripe_connect_account_id")
  WHERE "stripe_connect_account_id" IS NOT NULL;

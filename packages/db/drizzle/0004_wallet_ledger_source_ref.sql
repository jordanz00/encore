ALTER TABLE "wallet_ledger" ADD COLUMN IF NOT EXISTS "source_ref" varchar(200);

CREATE UNIQUE INDEX IF NOT EXISTS "wallet_ledger_wallet_source_dedup_uq"
  ON "wallet_ledger" ("wallet_id", "source_table", "source_ref")
  WHERE "source_table" IS NOT NULL AND "source_ref" IS NOT NULL;

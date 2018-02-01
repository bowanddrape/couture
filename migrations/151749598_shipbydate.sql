ALTER TABLE shipments ADD COLUMN IF NOT EXISTS ship_by INT;
UPDATE shipments SET ship_by=delivery_promised-432000 WHERE delivery_promised IS NOT NULL;

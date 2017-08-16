
ALTER TABLE shipments DROP COLUMN in_production;
ALTER TABLE shipments ADD COLUMN picked INTEGER;
ALTER TABLE shipments ADD COLUMN inspected INTEGER;
ALTER TABLE shipments ADD COLUMN ship_description TEXT;


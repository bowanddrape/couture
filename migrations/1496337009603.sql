
ALTER TABLE shipments ADD COLUMN approved INT; 
ALTER TABLE shipments ADD COLUMN on_hold INT; 
ALTER TABLE shipments ADD COLUMN in_production INT; 
ALTER TABLE shipments ADD COLUMN delivery_promised INT; 

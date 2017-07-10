
CREATE TABLE IF NOT EXISTS signup (
  id JSONB PRIMARY KEY,
  props JSONB,
  time INT DEFAULT date_part('epoch',NOW())
);

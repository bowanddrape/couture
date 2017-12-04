
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start INT DEFAULT date_part('epoch',NOW()),
  stop INT,
  text TEXT
);


CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  props JSONB DEFAULT '{}',
  event_time INT DEFAULT date_part('epoch',NOW())  
);

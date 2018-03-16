
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT,
  targets JSONB DEFAULT '[]',
  content JSONB DEFAULT '[]',
  props JSONB
);

INSERT INTO email_campaigns (query) VALUES ($$SELECT 'katlyn@bowanddrape.com' AS email$$); 
INSERT INTO email_campaigns (query) VALUES ($$SELECT email FROM users WHERE props#>>'{newsletter}'>NOW()-86400$$); 

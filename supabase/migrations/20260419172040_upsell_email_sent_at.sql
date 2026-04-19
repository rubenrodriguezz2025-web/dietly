-- Tracking de envío de email de upsell a d+10 tras registro.
-- Se marca cuando se envía para evitar reenviarlo en futuros logins.
ALTER TABLE profiles
  ADD COLUMN upsell_email_sent_at timestamptz DEFAULT NULL;

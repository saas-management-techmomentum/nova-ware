-- Enable pg_cron and pg_net extensions for recurring invoice automation
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - used for recurring invoice automation';
COMMENT ON EXTENSION pg_net IS 'Async HTTP client for PostgreSQL - used to call edge functions from cron jobs';

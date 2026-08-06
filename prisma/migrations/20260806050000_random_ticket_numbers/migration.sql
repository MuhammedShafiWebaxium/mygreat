DROP FUNCTION IF EXISTS generate_support_ticket_number();

DO $$
DECLARE
  sequence_name TEXT;
  random_start BIGINT := floor(random() * 9000000000 + 1000000000)::BIGINT;
BEGIN
  sequence_name := pg_get_serial_sequence('support_threads', 'ticket_number');

  IF sequence_name IS NULL THEN
    CREATE SEQUENCE support_threads_ticket_number_seq;
    sequence_name := 'support_threads_ticket_number_seq';
  END IF;

  PERFORM setval(sequence_name::regclass, random_start, FALSE);
  EXECUTE format(
    'ALTER TABLE support_threads ALTER COLUMN ticket_number SET DEFAULT nextval(%L::regclass)',
    sequence_name
  );
END;
$$;

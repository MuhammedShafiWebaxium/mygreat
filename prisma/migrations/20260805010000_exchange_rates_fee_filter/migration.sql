ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS fee_min_inr DECIMAL(14,2), ADD COLUMN IF NOT EXISTS fee_max_inr DECIMAL(14,2);
ALTER TABLE course_fees ADD COLUMN IF NOT EXISTS amount_inr DECIMAL(14,2), ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(18,8);

CREATE TABLE IF NOT EXISTS exchange_rates (
  currency_code VARCHAR(3) PRIMARY KEY,
  rate_to_inr DECIMAL(18,8) NOT NULL CHECK (rate_to_inr > 0),
  provider TEXT NOT NULL,
  provider_date DATE NOT NULL,
  refreshed_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO exchange_rates(currency_code,rate_to_inr,provider,provider_date)
VALUES ('INR',1,'SYSTEM',CURRENT_DATE)
ON CONFLICT (currency_code) DO NOTHING;

-- Normalize legacy display-only course tuition into the structured fee table.
-- The longest currency markers are checked first so AU$/CA$/NZ$/S$ are not
-- mistaken for plain USD. Rows without a parseable positive amount are left
-- untouched and are reported by the Super Admin fee-coverage counter.
INSERT INTO course_fees(course_id,amount,currency_code,amount_inr,exchange_rate,effective_from)
SELECT co.id,parsed.amount,parsed.currency_code,
       CASE WHEN parsed.currency_code='INR' THEN parsed.amount ELSE NULL END,
       CASE WHEN parsed.currency_code='INR' THEN 1 ELSE NULL END,NOW()
FROM courses co
JOIN universities u ON u.id=co.university_id
JOIN countries country ON country.id=u.country_id
CROSS JOIN LATERAL (
  SELECT NULLIF(regexp_replace(co.tuition_fee,'[^0-9.]','','g'),'')::DECIMAL(12,2) AS amount,
    CASE
      WHEN co.tuition_fee ~* '^\s*AU\$' THEN 'AUD'
      WHEN co.tuition_fee ~* '^\s*CA\$' THEN 'CAD'
      WHEN co.tuition_fee ~* '^\s*NZ\$' THEN 'NZD'
      WHEN co.tuition_fee ~* '^\s*S\$' THEN 'SGD'
      WHEN co.tuition_fee ~* '^\s*(Dhs|AED)' THEN 'AED'
      WHEN co.tuition_fee ~* '^\s*(INR|₹)' THEN 'INR'
      WHEN co.tuition_fee ~ '^\s*£' THEN 'GBP'
      WHEN co.tuition_fee ~ '^\s*€' THEN 'EUR'
      WHEN co.tuition_fee ~ '^\s*\$' THEN 'USD'
      ELSE UPPER(country.currency_code)
    END AS currency_code
) parsed
WHERE TRIM(co.tuition_fee)<>'' AND parsed.amount>0
  AND NOT EXISTS (SELECT 1 FROM course_fees fee WHERE fee.course_id=co.id AND (fee.effective_to IS NULL OR fee.effective_to>NOW()));

UPDATE course_fees SET amount_inr=amount,exchange_rate=1
WHERE currency_code='INR' AND amount_inr IS NULL;

CREATE INDEX IF NOT EXISTS course_fees_amount_inr_idx ON course_fees(amount_inr) WHERE effective_to IS NULL;

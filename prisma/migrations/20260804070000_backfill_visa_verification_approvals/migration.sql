INSERT INTO workflow_approval_requests(
  student_id, application_id, followup_id, workflow_type, visa_attempt_id,
  stage, requested_by_id, requested_by_name
)
SELECT a.student_id, v.application_id, f.id, 'VISA', v.id,
  CASE v.current_stage::text
    WHEN 'VISA_SLOT_BOOKING' THEN 'VISA_LEVEL_1_VERIFICATION'
    WHEN 'VISA_LEVEL_1_VERIFICATION' THEN 'VISA_LEVEL_2_VERIFICATION'
  END,
  f.created_by_id, f.created_by_name
FROM visa_attempts v
JOIN applications a ON a.id = v.application_id
JOIN LATERAL (
  SELECT id, created_by_id, created_by_name
  FROM workflow_followups
  WHERE visa_attempt_id = v.id
  ORDER BY followed_up_at DESC, id DESC
  LIMIT 1
) f ON TRUE
WHERE v.is_current = TRUE
  AND v.current_stage::text IN ('VISA_SLOT_BOOKING', 'VISA_LEVEL_1_VERIFICATION')
  AND NOT EXISTS (
    SELECT 1 FROM workflow_approval_requests r
    WHERE r.visa_attempt_id = v.id
      AND r.stage = CASE v.current_stage::text
        WHEN 'VISA_SLOT_BOOKING' THEN 'VISA_LEVEL_1_VERIFICATION'
        WHEN 'VISA_LEVEL_1_VERIFICATION' THEN 'VISA_LEVEL_2_VERIFICATION'
      END
      AND r.status = 'PENDING'
  );

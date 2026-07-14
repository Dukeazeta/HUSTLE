INSERT INTO contacts (
  id,
  business_id,
  channel,
  value,
  normalized_value,
  source_url,
  discovered_at,
  verified,
  is_primary
)
SELECT
  'con_' || lower(hex(randomblob(16))),
  business.id,
  'phone',
  business.phone,
  replace(
    replace(
      replace(
        replace(
          replace(business.phone, ' ', ''),
          '-',
          ''
        ),
        '(',
        ''
      ),
      ')',
      ''
    ),
    '.',
    ''
  ),
  business.source_url,
  business.source_discovered_at,
  0,
  0
FROM businesses AS business
WHERE business.phone IS NOT NULL
  AND trim(business.phone) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM contacts AS contact
    WHERE contact.business_id = business.id
      AND contact.channel = 'phone'
  );

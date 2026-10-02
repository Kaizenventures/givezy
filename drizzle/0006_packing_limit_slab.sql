-- Bring the saved packing limit down from 5 kg to 4.5 kg.
--
-- Couriers charge by slab. A 5 kg packing limit plus the 220 g sack declares
-- 5.22 kg, which bills in the 10 kg slab (~Rs 311) instead of the 5 kg slab
-- (~Rs 231) — Rs 80 per pickup for not one extra book. 4.5 kg declares 4.72 kg
-- and stays in the cheaper slab.
--
-- This has to be a data migration because prices and bags are saved in
-- `settings`, and a saved value overrides the default in the code. Changing
-- DEFAULT_BAGS alone would have had no effect on the live site.
--
-- Deliberately narrow: only the single-bag configuration with a limit of
-- exactly 5 kg, which is what production holds. Anything a human has since
-- edited is left alone. Idempotent — after it runs the WHERE no longer matches.
UPDATE `settings`
SET `value` = json_set(`value`, '$[0].maxKg', 4.5),
    `updated_at` = CURRENT_TIMESTAMP
WHERE `key` = 'pricing.bags'
  AND json_valid(`value`)
  AND json_array_length(`value`) = 1
  AND json_extract(`value`, '$[0].maxKg') = 5.0
  AND json_extract(`value`, '$[0].tareGrams') = 220;

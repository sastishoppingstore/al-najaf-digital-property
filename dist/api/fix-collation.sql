-- ============================================================================
-- Al Najaf Digital Property - COLLATION FIX
-- Run this in phpMyAdmin (StackCP) -> select your DB -> SQL tab -> paste -> Go
--
-- The new app `properties` table uses utf8mb4_unicode_ci, but the legacy
-- `property_images` (and other property_id tables) use utf8mb4_general_ci.
-- This makes JOINs like property_images.property_id = properties.id fail with
-- "Illegal mix of collations". This script aligns every table that holds
-- property ids to utf8mb4_unicode_ci so all JOINs work.
-- ============================================================================

ALTER TABLE `property_images` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `property_overrides` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `inquiries` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `favorites` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `properties` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- DONE. Verify: In Admin, the property list (and add-property) must work now.
-- ============================================================================

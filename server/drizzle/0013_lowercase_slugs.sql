-- Custom slugs used to keep their case; lookups are case-insensitive now.
-- Leave a slug alone if lowercasing it would clash with another link.
UPDATE `links` SET `slug` = lower(`slug`)
WHERE `slug` <> lower(`slug`)
  AND lower(`slug`) NOT IN (SELECT `slug` FROM `links`);

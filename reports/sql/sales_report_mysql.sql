-- MySQL script: create report tables and populate them with yearly and quarterly disposal totals
-- Usage: run this in your MySQL client connected to the database that contains the `api_disposal` table.
-- Example (PowerShell):
-- mysql -u your_user -p -D your_database < "C:/.../sales_report_mysql.sql"

-- BEGIN TRANSACTION
START TRANSACTION;

-- Yearly totals table
CREATE TABLE IF NOT EXISTS report_disposal_yearly (
  `year` INT NOT NULL,
  `total` DECIMAL(14,2) DEFAULT 0,
  PRIMARY KEY (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clear previous data so running repeatedly replaces old results
TRUNCATE TABLE report_disposal_yearly;

INSERT INTO report_disposal_yearly (`year`, `total`)
SELECT
  YEAR(disposal_date) AS year,
  ROUND(SUM(disposal_value), 2) AS total
FROM api_disposal
WHERE disposal_date IS NOT NULL
GROUP BY YEAR(disposal_date)
ORDER BY year;

-- Quarterly totals table
CREATE TABLE IF NOT EXISTS report_disposal_quarterly (
  `year` INT NOT NULL,
  `quarter` TINYINT NOT NULL,
  `total` DECIMAL(14,2) DEFAULT 0,
  PRIMARY KEY (`year`, `quarter`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

TRUNCATE TABLE report_disposal_quarterly;

INSERT INTO report_disposal_quarterly (`year`, `quarter`, `total`)
SELECT
  YEAR(disposal_date) AS year,
  QUARTER(disposal_date) AS quarter,
  ROUND(SUM(disposal_value), 2) AS total
FROM api_disposal
WHERE disposal_date IS NOT NULL
GROUP BY YEAR(disposal_date), QUARTER(disposal_date)
ORDER BY year, quarter;

COMMIT;

-- Optional: show the results
SELECT * FROM report_disposal_yearly ORDER BY `year`;
SELECT * FROM report_disposal_quarterly ORDER BY `year`, `quarter`;

-- Notes:
-- 1) If your disposal table has a different name or schema prefix, replace `api_disposal` with the correct fully-qualified name (e.g. `my_schema.api_disposal`).
-- 2) If disposal_value is stored as text, you may need CAST(disposal_value AS DECIMAL(14,2)) in the SELECT.
-- 3) Running this script repeatedly will replace the contents of the two report tables (TRUNCATE + INSERT).

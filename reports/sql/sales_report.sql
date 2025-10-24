-- Yearly and Quarterly Sales Report for disposals
-- Assumes table name: api_disposal and columns disposal_date (date) and disposal_value (numeric)

-- Yearly totals
SELECT
  YEAR(disposal_date) AS year,
  ROUND(SUM(disposal_value), 2) AS total
FROM api_disposal
WHERE disposal_date IS NOT NULL
GROUP BY YEAR(disposal_date)
ORDER BY year;

-- Quarterly totals
-- This groups months into quarters and outputs year + quarter label
SELECT
  YEAR(disposal_date) AS year,
  QUARTER(disposal_date) AS quarter,
  ROUND(SUM(disposal_value), 2) AS total
FROM api_disposal
WHERE disposal_date IS NOT NULL
GROUP BY YEAR(disposal_date), QUARTER(disposal_date)
ORDER BY year, quarter;
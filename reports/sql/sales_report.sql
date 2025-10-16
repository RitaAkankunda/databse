-- Yearly and Quarterly Sales Report for disposals
-- Assumes table name: api_disposal and columns disposal_date (date) and disposal_value (numeric)

-- Yearly totals
SELECT
  EXTRACT(YEAR FROM disposal_date)::int AS year,
  SUM(disposal_value)::numeric(14,2) AS total
FROM api_disposal
WHERE disposal_date IS NOT NULL
GROUP BY year
ORDER BY year;

-- Quarterly totals
-- This groups months into quarters and outputs year + quarter label
SELECT
  year,
  quarter,
  SUM(total) AS total
FROM (
  SELECT
    EXTRACT(YEAR FROM disposal_date)::int AS year,
    CEIL(EXTRACT(MONTH FROM disposal_date)::numeric / 3)::int AS quarter,
    SUM(disposal_value)::numeric(14,2) AS total
  FROM api_disposal
  WHERE disposal_date IS NOT NULL
  GROUP BY year, quarter
) q
GROUP BY year, quarter
ORDER BY year, quarter;

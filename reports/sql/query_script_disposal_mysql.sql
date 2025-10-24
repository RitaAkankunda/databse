-- query_script_disposal_mysql.sql
-- Disposal-specific MySQL report script for this project
-- Uses: api_disposal(disposal_id, asset_id, disposal_date, disposal_value, buyer_id, reason),
--       api_buyer(buyer_id, name), api_asset(asset_id, asset_name)
-- Run in MySQL Workbench or via CLI:
--   mysql -u your_user -p -D your_database < query_script_disposal_mysql.sql

SELECT '==== Disposal Reports (api_disposal) ====' AS title;

-- Yearly totals
SELECT
  YEAR(disposal_date) AS year,
  COUNT(*) AS disposals,
  ROUND(SUM(disposal_value),2) AS total_revenue
FROM api_disposal
WHERE disposal_date IS NOT NULL
GROUP BY YEAR(disposal_date)
ORDER BY year DESC;

-- Quarterly totals
SELECT
  YEAR(disposal_date) AS year,
  QUARTER(disposal_date) AS quarter,
  COUNT(*) AS disposals,
  ROUND(SUM(disposal_value),2) AS total_revenue
FROM api_disposal
WHERE disposal_date IS NOT NULL
GROUP BY YEAR(disposal_date), QUARTER(disposal_date)
ORDER BY year DESC, quarter DESC;

-- Top buyers by revenue
SELECT
  b.name AS buyer_name,
  COUNT(d.disposal_id) AS disposals,
  ROUND(SUM(d.disposal_value),2) AS revenue
FROM api_disposal d
LEFT JOIN api_buyer b ON b.buyer_id = d.buyer_id
GROUP BY b.name
ORDER BY revenue DESC
LIMIT 20;

-- Top assets by revenue (or frequency)
SELECT
  a.asset_name,
  COUNT(d.disposal_id) AS disposals,
  ROUND(SUM(d.disposal_value),2) AS revenue
FROM api_disposal d
LEFT JOIN api_asset a ON a.asset_id = d.asset_id
GROUP BY a.asset_name
ORDER BY revenue DESC
LIMIT 20;

-- Monthly trend (last 24 months)
SELECT
  DATE_FORMAT(disposal_date, '%Y-%m') AS month,
  COUNT(*) AS disposals,
  ROUND(SUM(disposal_value),2) AS revenue
FROM api_disposal
WHERE disposal_date IS NOT NULL
GROUP BY DATE_FORMAT(disposal_date, '%Y-%m')
ORDER BY month DESC
LIMIT 24;

-- Period-over-period growth (quarterly and yearly) — requires MySQL 8+
WITH period_revenue AS (
  SELECT
    YEAR(disposal_date) AS year,
    QUARTER(disposal_date) AS quarter,
    CONCAT(YEAR(disposal_date), '-Q', QUARTER(disposal_date)) AS period_label,
    SUM(disposal_value) AS revenue
  FROM api_disposal
  WHERE disposal_date IS NOT NULL
  GROUP BY YEAR(disposal_date), QUARTER(disposal_date)
),
q AS (
  SELECT *, LAG(revenue) OVER (ORDER BY year, quarter) AS prev_revenue FROM period_revenue
)
SELECT 'Quarterly growth (period, revenue, prev_revenue, pct_change)' AS title;
SELECT period_label, revenue, prev_revenue,
  ROUND((revenue - prev_revenue) / NULLIF(prev_revenue,0) * 100,2) AS pct_change
FROM q
ORDER BY period_label DESC;

WITH yearly AS (
  SELECT YEAR(disposal_date) AS year, SUM(disposal_value) AS revenue
  FROM api_disposal
  WHERE disposal_date IS NOT NULL
  GROUP BY YEAR(disposal_date)
)
SELECT 'Yearly growth (year, revenue, prev_revenue, pct_change)' AS title;
SELECT y.year, y.revenue, LAG(y.revenue) OVER (ORDER BY y.year) AS prev_revenue,
  ROUND((y.revenue - LAG(y.revenue) OVER (ORDER BY y.year)) / NULLIF(LAG(y.revenue) OVER (ORDER BY y.year), 0) * 100,2) AS pct_change
FROM yearly y
ORDER BY y.year DESC;

SELECT '==== End of disposal report ====' AS footer;

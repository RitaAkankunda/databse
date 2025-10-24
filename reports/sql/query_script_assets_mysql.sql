-- query_script_assets_mysql.sql
-- Asset management system report script (MySQL)
-- Targets: api_asset, api_disposal, api_buyer, api_category, api_assetvaluation,
--          api_maintenance, api_assignment
-- Usage:
--   mysql -u your_user -p -D your_database < query_script_assets_mysql.sql
-- Or open in MySQL Workbench and run the whole script (make sure correct schema is selected).

SELECT '==== Asset system summary ====' AS title;

-- Top-level KPIs
SELECT
  (SELECT COUNT(*) FROM api_asset) AS total_assets,
  (SELECT COUNT(*) FROM api_asset WHERE LOWER(COALESCE(status,'')) = 'active') AS active_assets,
  (SELECT COUNT(*) FROM api_asset WHERE LOWER(COALESCE(status,'')) <> 'active') AS inactive_assets,
  (SELECT COUNT(*) FROM api_disposal) AS total_disposals,
  (SELECT ROUND(COALESCE(SUM(disposal_value),0),2) FROM api_disposal) AS disposal_revenue,
  (SELECT COUNT(*) FROM api_assignment WHERE LOWER(COALESCE(status,'')) NOT IN ('returned','completed')) AS open_assignments;

-- Disposals by year
SELECT YEAR(disposal_date) AS year, COUNT(*) AS disposals, ROUND(SUM(disposal_value),2) AS revenue
FROM api_disposal
WHERE disposal_date IS NOT NULL
GROUP BY YEAR(disposal_date)
ORDER BY year DESC;

-- Disposals by quarter
SELECT YEAR(disposal_date) AS year, QUARTER(disposal_date) AS quarter, COUNT(*) AS disposals, ROUND(SUM(disposal_value),2) AS revenue
FROM api_disposal
WHERE disposal_date IS NOT NULL
GROUP BY YEAR(disposal_date), QUARTER(disposal_date)
ORDER BY year DESC, quarter DESC;

-- Top buyers (by revenue)
SELECT COALESCE(b.name, 'Unknown') AS buyer_name, COUNT(d.disposal_id) AS disposals, ROUND(SUM(d.disposal_value),2) AS revenue
FROM api_disposal d
LEFT JOIN api_buyer b ON b.buyer_id = d.buyer_id
GROUP BY b.name
ORDER BY revenue DESC
LIMIT 20;

-- Top assets (by revenue)
SELECT COALESCE(a.asset_name, CONCAT('asset-', d.asset_id)) AS asset_name, COUNT(d.disposal_id) AS disposals, ROUND(SUM(d.disposal_value),2) AS revenue
FROM api_disposal d
LEFT JOIN api_asset a ON a.asset_id = d.asset_id
GROUP BY a.asset_name, d.asset_id
ORDER BY revenue DESC
LIMIT 20;

-- Assets by category
SELECT COALESCE(c.category_name, 'Uncategorized') AS category, COUNT(a.asset_id) AS assets
FROM api_asset a
LEFT JOIN api_category c ON c.category_id = a.category_id
GROUP BY c.category_name
ORDER BY assets DESC;

-- Valuation histogram (buckets): adjust ranges as needed
SELECT bucket_label, COUNT(*) AS count_assets
FROM (
  SELECT
    CASE
      WHEN current_value IS NULL THEN 'Unknown'
      WHEN av.current_value IS NULL THEN 'Unknown'
      WHEN av.current_value < 10000 THEN '<10k'
      WHEN av.current_value < 50000 THEN '10k-50k'
      WHEN av.current_value < 100000 THEN '50k-100k'
      WHEN av.current_value < 500000 THEN '100k-500k'
      ELSE '500k+'
    END AS bucket_label
  FROM api_assetvaluation av
  LEFT JOIN api_asset a ON a.asset_id = av.asset_id
) t
GROUP BY bucket_label
ORDER BY FIELD(bucket_label, '<10k','10k-50k','50k-100k','100k-500k','500k+','Unknown');

-- Monthly maintenance cost (last 24 months)
SELECT DATE_FORMAT(maintenance_date, '%Y-%m') AS month, COUNT(*) AS tickets, ROUND(SUM(cost),2) AS total_cost
FROM api_maintenance
WHERE maintenance_date IS NOT NULL
GROUP BY DATE_FORMAT(maintenance_date, '%Y-%m')
ORDER BY month DESC
LIMIT 24;

-- Assignments: overdue by status and by date
SELECT
  SUM(CASE WHEN LOWER(COALESCE(status,'')) = 'overdue' THEN 1 ELSE 0 END) AS overdue_by_status,
  SUM(CASE WHEN return_date IS NOT NULL AND return_date < CURRENT_DATE() AND LOWER(COALESCE(status,'')) <> 'returned' THEN 1 ELSE 0 END) AS overdue_by_date
FROM api_assignment;

-- Recent disposals (last 20)
SELECT d.disposal_id, a.asset_name, d.disposal_date, d.disposal_value, COALESCE(b.name,'') AS buyer_name, d.reason
FROM api_disposal d
LEFT JOIN api_asset a ON a.asset_id = d.asset_id
LEFT JOIN api_buyer b ON b.buyer_id = d.buyer_id
ORDER BY d.disposal_date DESC
LIMIT 20;

-- Notes: if any of the SELECTs return NULL or 0 unexpectedly, ensure your database and schema
-- are selected and that tables have rows. Adjust bucket ranges or limits as needed.

SELECT '==== End of asset-system report ====' AS footer;

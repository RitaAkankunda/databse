-- full_system_report_mysql.sql
-- Comprehensive report for the asset management system
-- Produces counts, top-n lists, time series, and summary stats across most tables.
-- Run with:
--   mysql -u root -p -D <your_db> < full_system_report_mysql.sql

SELECT '==== Full System Report (api_*) ====' AS title;

-- 1) Top-level counts
SELECT
  (SELECT COUNT(*) FROM api_asset) AS total_assets,
  (SELECT COUNT(*) FROM api_category) AS total_categories,
  (SELECT COUNT(*) FROM api_user) AS total_users,
  (SELECT COUNT(*) FROM api_assignment) AS total_assignments,
  (SELECT COUNT(*) FROM api_maintenance) AS total_maintenance_tickets,
  (SELECT COUNT(*) FROM api_assetvaluation) AS total_valuations,
  (SELECT COUNT(*) FROM api_disposal) AS total_disposals,
  (SELECT COUNT(*) FROM api_supplier) AS total_suppliers,
  (SELECT COUNT(*) FROM api_buyer) AS total_buyers;

-- 2) Recent activity: recent assets, assignments, maintenance, disposals (last 10)
SELECT 'Recent Assets' AS section;
SELECT asset_id, asset_name, category_id, purchase_date, status FROM api_asset ORDER BY asset_id DESC LIMIT 10;

SELECT 'Recent Assignments' AS section;
SELECT assignment_id, asset_id, user_id, assigned_date, return_date, status FROM api_assignment ORDER BY assigned_date DESC LIMIT 10;

SELECT 'Recent Maintenance' AS section;
SELECT maintenance_id, asset_id, maintenance_date, cost, staff, performed_by FROM api_maintenance ORDER BY maintenance_date DESC LIMIT 10;

SELECT 'Recent Disposals' AS section;
SELECT disposal_id, asset_id, disposal_date, disposal_value, buyer_id FROM api_disposal ORDER BY disposal_date DESC LIMIT 10;

-- 3) Assets by status and by category
SELECT 'Assets by status' AS section;
SELECT COALESCE(status,'Unknown') AS status, COUNT(*) AS count_assets FROM api_asset GROUP BY COALESCE(status,'Unknown') ORDER BY count_assets DESC;

SELECT 'Assets by category (top)' AS section;
SELECT COALESCE(c.category_name,'Uncategorized') AS category, COUNT(a.asset_id) AS count_assets
FROM api_asset a
LEFT JOIN api_category c ON c.category_id = a.category_id
GROUP BY c.category_name
ORDER BY count_assets DESC
LIMIT 20;

-- 4) Assignments summary: open, overdue (status & date), top users by assignments
SELECT 'Assignments summary' AS section;
SELECT
  COUNT(*) AS total_assignments,
  SUM(CASE WHEN LOWER(COALESCE(status,'')) NOT IN ('returned','completed') THEN 1 ELSE 0 END) AS open_assignments,
  SUM(CASE WHEN LOWER(COALESCE(status,'')) = 'overdue' THEN 1 ELSE 0 END) AS overdue_by_status,
  SUM(CASE WHEN return_date IS NOT NULL AND return_date < CURRENT_DATE() AND LOWER(COALESCE(status,'')) <> 'returned' THEN 1 ELSE 0 END) AS overdue_by_date
FROM api_assignment;

SELECT 'Top users by assignments' AS section;
SELECT u.name AS user_name, COUNT(a.assignment_id) AS assignments_count
FROM api_assignment a
LEFT JOIN api_user u ON u.user_id = a.user_id
GROUP BY u.user_id, u.name
ORDER BY assignments_count DESC
LIMIT 20;

-- 5) Maintenance: cost totals, top assets by maintenance cost
SELECT 'Maintenance totals' AS section;
SELECT
  COUNT(*) AS tickets,
  ROUND(COALESCE(SUM(cost),0),2) AS total_cost
FROM api_maintenance;

SELECT 'Top assets by maintenance cost' AS section;
SELECT a.asset_name, m.asset_id, COUNT(m.maintenance_id) AS tickets, ROUND(SUM(m.cost),2) AS total_cost
FROM api_maintenance m
LEFT JOIN api_asset a ON a.asset_id = m.asset_id
GROUP BY m.asset_id, a.asset_name
ORDER BY total_cost DESC
LIMIT 20;

-- 6) Valuations: avg/current/min/max and histogram buckets
SELECT 'Valuation stats' AS section;
SELECT
  COUNT(*) AS valuations_count,
  ROUND(AVG(current_value),2) AS avg_valuation,
  ROUND(MIN(current_value),2) AS min_valuation,
  ROUND(MAX(current_value),2) AS max_valuation
FROM api_assetvaluation;

SELECT 'Valuation histogram' AS section;
SELECT bucket_label, COUNT(*) AS count_assets
FROM (
  SELECT
    CASE
      WHEN av.current_value IS NULL THEN 'Unknown'
      WHEN av.current_value < 10000 THEN '<10k'
      WHEN av.current_value < 50000 THEN '10k-50k'
      WHEN av.current_value < 100000 THEN '50k-100k'
      WHEN av.current_value < 500000 THEN '100k-500k'
      ELSE '500k+'
    END AS bucket_label
  FROM api_assetvaluation av
) t
GROUP BY bucket_label
ORDER BY FIELD(bucket_label, '<10k','10k-50k','50k-100k','100k-500k','500k+','Unknown');

-- 7) Disposal summary: totals and top buyers/assets
SELECT 'Disposal totals' AS section;
SELECT COUNT(*) AS disposals_count, ROUND(COALESCE(SUM(disposal_value),0),2) AS total_revenue FROM api_disposal;

SELECT 'Top buyers by disposal revenue' AS section;
SELECT b.name AS buyer_name, COUNT(d.disposal_id) AS disposals, ROUND(SUM(d.disposal_value),2) AS revenue
FROM api_disposal d
LEFT JOIN api_buyer b ON b.buyer_id = d.buyer_id
GROUP BY b.buyer_id, b.name
ORDER BY revenue DESC
LIMIT 20;

SELECT 'Top assets by disposal revenue' AS section;
SELECT a.asset_name, d.asset_id, COUNT(d.disposal_id) AS disposals, ROUND(SUM(d.disposal_value),2) AS revenue
FROM api_disposal d
LEFT JOIN api_asset a ON a.asset_id = d.asset_id
GROUP BY d.asset_id, a.asset_name
ORDER BY revenue DESC
LIMIT 20;

-- 8) Suppliers and buyers overview
SELECT 'Suppliers and buyers count' AS section;
SELECT (SELECT COUNT(*) FROM api_supplier) AS suppliers_count, (SELECT COUNT(*) FROM api_buyer) AS buyers_count;

-- 9) Assets by location (if location_id used)
SELECT 'Assets by location' AS section;
SELECT COALESCE(l.building, CONCAT('loc-', a.location_id)) AS location_label, COUNT(a.asset_id) AS assets
FROM api_asset a
LEFT JOIN api_location l ON l.location_id = a.location_id
GROUP BY location_label
ORDER BY assets DESC
LIMIT 20;

-- 10) Users by role (if role present)
SELECT 'Users by role' AS section;
SELECT role, COUNT(*) AS count_users FROM api_user GROUP BY role ORDER BY count_users DESC;

-- 11) Quick integrity checks: assets without category, assignments without user/asset
SELECT 'Integrity checks' AS section;
SELECT 'assets_without_category' AS issue, COUNT(*) AS count FROM api_asset WHERE category_id IS NULL OR category_id = '';
SELECT 'assignments_without_user' AS issue, COUNT(*) AS count FROM api_assignment WHERE user_id IS NULL;
SELECT 'assignments_without_asset' AS issue, COUNT(*) AS count FROM api_assignment WHERE asset_id IS NULL;

SELECT '==== End of full system report ====' AS footer;

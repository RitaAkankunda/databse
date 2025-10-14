# Asset Management System - Reports & Analytics

## 📊 Executive Summary Reports

### 1. Asset Performance Dashboard
```sql
-- Total Assets by Category
SELECT 
    c.category_name,
    COUNT(a.asset_id) as total_assets,
    SUM(a.purchase_cost) as total_value,
    AVG(a.purchase_cost) as avg_value
FROM api_asset a
JOIN api_category c ON a.category_id = c.category_id
GROUP BY c.category_name
ORDER BY total_value DESC;
```

### 2. Asset Utilization Report
```sql
-- Asset Assignment Status
SELECT 
    CASE 
        WHEN a.asset_id IN (SELECT asset_id FROM api_assignment WHERE return_date IS NULL) 
        THEN 'Assigned'
        ELSE 'Available'
    END as status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM api_asset), 2) as percentage
FROM api_asset a
GROUP BY status;
```

### 3. Maintenance Cost Analysis
```sql
-- Monthly Maintenance Costs
SELECT 
    DATE_FORMAT(maintenance_date, '%Y-%m') as month,
    COUNT(*) as maintenance_count,
    SUM(cost) as total_cost,
    AVG(cost) as avg_cost
FROM api_maintenance
WHERE maintenance_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(maintenance_date, '%Y-%m')
ORDER BY month DESC;
```

## 💰 Financial Reports

### 4. Asset Purchase Summary (Yearly)
```sql
-- Yearly Asset Purchases
SELECT 
    YEAR(purchase_date) as year,
    COUNT(*) as assets_purchased,
    SUM(purchase_cost) as total_investment,
    AVG(purchase_cost) as avg_asset_cost,
    MIN(purchase_cost) as cheapest_asset,
    MAX(purchase_cost) as most_expensive_asset
FROM api_asset
WHERE purchase_date IS NOT NULL
GROUP BY YEAR(purchase_date)
ORDER BY year DESC;
```

### 5. Quarterly Asset Performance
```sql
-- Quarterly Asset Analysis
SELECT 
    CONCAT(YEAR(purchase_date), '-Q', QUARTER(purchase_date)) as quarter,
    COUNT(*) as assets_purchased,
    SUM(purchase_cost) as total_investment,
    COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_assets,
    COUNT(CASE WHEN status = 'Maintenance' THEN 1 END) as under_maintenance,
    COUNT(CASE WHEN status = 'Disposed' THEN 1 END) as disposed_assets
FROM api_asset
WHERE purchase_date IS NOT NULL
GROUP BY YEAR(purchase_date), QUARTER(purchase_date)
ORDER BY quarter DESC;
```

### 6. ROI Analysis Report
```sql
-- Return on Investment Analysis
SELECT 
    a.asset_name,
    a.purchase_cost as initial_cost,
    av.current_value,
    (av.current_value - a.purchase_cost) as gain_loss,
    ROUND(((av.current_value - a.purchase_cost) / a.purchase_cost) * 100, 2) as roi_percentage,
    DATEDIFF(NOW(), a.purchase_date) as days_owned
FROM api_asset a
JOIN api_assetvaluation av ON a.asset_id = av.asset_id
WHERE av.valuation_date = (
    SELECT MAX(valuation_date) 
    FROM api_assetvaluation av2 
    WHERE av2.asset_id = a.asset_id
)
ORDER BY roi_percentage DESC;
```

## 📈 Department Analytics

### 7. Department Asset Distribution
```sql
-- Assets by Department
SELECT 
    u.department,
    COUNT(DISTINCT a.asset_id) as total_assets,
    SUM(a.purchase_cost) as total_value,
    COUNT(DISTINCT u.user_id) as users_count,
    ROUND(SUM(a.purchase_cost) / COUNT(DISTINCT u.user_id), 2) as value_per_user
FROM api_user u
JOIN api_assignment ass ON u.user_id = ass.user_id
JOIN api_asset a ON ass.asset_id = a.asset_id
WHERE ass.return_date IS NULL
GROUP BY u.department
ORDER BY total_value DESC;
```

### 8. User Productivity Report
```sql
-- User Asset Assignment History
SELECT 
    u.name,
    u.department,
    COUNT(ass.assignment_id) as total_assignments,
    COUNT(CASE WHEN ass.return_date IS NULL THEN 1 END) as current_assignments,
    COUNT(CASE WHEN ass.return_date IS NOT NULL THEN 1 END) as completed_assignments,
    AVG(DATEDIFF(COALESCE(ass.return_date, NOW()), ass.assigned_date)) as avg_assignment_duration
FROM api_user u
LEFT JOIN api_assignment ass ON u.user_id = ass.user_id
GROUP BY u.user_id, u.name, u.department
ORDER BY total_assignments DESC;
```

## 🔧 Maintenance Reports

### 9. Maintenance Frequency Analysis
```sql
-- Assets Requiring Most Maintenance
SELECT 
    a.asset_name,
    c.category_name,
    COUNT(m.maintenance_id) as maintenance_count,
    SUM(m.cost) as total_maintenance_cost,
    AVG(m.cost) as avg_maintenance_cost,
    MAX(m.maintenance_date) as last_maintenance
FROM api_asset a
JOIN api_category c ON a.category_id = c.category_id
LEFT JOIN api_maintenance m ON a.asset_id = m.asset_id
GROUP BY a.asset_id, a.asset_name, c.category_name
HAVING maintenance_count > 0
ORDER BY maintenance_count DESC, total_maintenance_cost DESC;
```

### 10. Maintenance Cost Trends
```sql
-- Monthly Maintenance Cost Trends
SELECT 
    DATE_FORMAT(maintenance_date, '%Y-%m') as month,
    COUNT(*) as maintenance_events,
    SUM(cost) as total_cost,
    AVG(cost) as avg_cost,
    MIN(cost) as min_cost,
    MAX(cost) as max_cost
FROM api_maintenance
WHERE maintenance_date >= DATE_SUB(NOW(), INTERVAL 24 MONTH)
GROUP BY DATE_FORMAT(maintenance_date, '%Y-%m')
ORDER BY month DESC;
```

## 💸 Disposal & Sales Reports

### 11. Asset Disposal Summary
```sql
-- Disposal Revenue Report
SELECT 
    YEAR(d.disposal_date) as year,
    QUARTER(d.disposal_date) as quarter,
    COUNT(*) as assets_disposed,
    SUM(d.disposal_value) as total_revenue,
    AVG(d.disposal_value) as avg_disposal_value,
    SUM(a.purchase_cost) as original_cost,
    (SUM(d.disposal_value) - SUM(a.purchase_cost)) as net_gain_loss
FROM api_disposal d
JOIN api_asset a ON d.asset_id = a.asset_id
WHERE d.disposal_date IS NOT NULL
GROUP BY YEAR(d.disposal_date), QUARTER(d.disposal_date)
ORDER BY year DESC, quarter DESC;
```

### 12. Top Disposal Buyers
```sql
-- Most Active Disposal Buyers
SELECT 
    b.name as buyer_name,
    b.email,
    COUNT(d.disposal_id) as purchases_made,
    SUM(d.disposal_value) as total_spent,
    AVG(d.disposal_value) as avg_purchase_value,
    MAX(d.disposal_date) as last_purchase
FROM api_buyer b
JOIN api_disposal d ON b.buyer_id = d.buyer_id
GROUP BY b.buyer_id, b.name, b.email
ORDER BY total_spent DESC;
```

## 📊 Asset Lifecycle Reports

### 13. Asset Age Analysis
```sql
-- Asset Age Distribution
SELECT 
    CASE 
        WHEN DATEDIFF(NOW(), purchase_date) < 365 THEN 'Less than 1 year'
        WHEN DATEDIFF(NOW(), purchase_date) < 1095 THEN '1-3 years'
        WHEN DATEDIFF(NOW(), purchase_date) < 1825 THEN '3-5 years'
        WHEN DATEDIFF(NOW(), purchase_date) < 3650 THEN '5-10 years'
        ELSE 'More than 10 years'
    END as age_category,
    COUNT(*) as asset_count,
    SUM(purchase_cost) as total_value,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM api_asset), 2) as percentage
FROM api_asset
WHERE purchase_date IS NOT NULL
GROUP BY age_category
ORDER BY 
    CASE age_category
        WHEN 'Less than 1 year' THEN 1
        WHEN '1-3 years' THEN 2
        WHEN '3-5 years' THEN 3
        WHEN '5-10 years' THEN 4
        ELSE 5
    END;
```

### 14. Warranty Expiry Report
```sql
-- Assets with Expiring Warranties
SELECT 
    a.asset_name,
    c.category_name,
    a.purchase_date,
    a.warranty_expiry,
    DATEDIFF(a.warranty_expiry, NOW()) as days_until_expiry,
    a.purchase_cost,
    CASE 
        WHEN DATEDIFF(a.warranty_expiry, NOW()) < 0 THEN 'Expired'
        WHEN DATEDIFF(a.warranty_expiry, NOW()) < 30 THEN 'Expires Soon'
        WHEN DATEDIFF(a.warranty_expiry, NOW()) < 90 THEN 'Expires in 3 Months'
        ELSE 'Valid'
    END as warranty_status
FROM api_asset a
JOIN api_category c ON a.category_id = c.category_id
WHERE a.warranty_expiry IS NOT NULL
ORDER BY a.warranty_expiry ASC;
```

## 🎯 Key Performance Indicators (KPIs)

### 15. Overall System KPIs
```sql
-- System Performance Metrics
SELECT 
    'Total Assets' as metric,
    COUNT(*) as value
FROM api_asset
UNION ALL
SELECT 
    'Total Users',
    COUNT(*)
FROM api_user
UNION ALL
SELECT 
    'Active Assignments',
    COUNT(*)
FROM api_assignment
WHERE return_date IS NULL
UNION ALL
SELECT 
    'Total Asset Value',
    SUM(purchase_cost)
FROM api_asset
UNION ALL
SELECT 
    'Assets Under Maintenance',
    COUNT(*)
FROM api_asset
WHERE status = 'Maintenance'
UNION ALL
SELECT 
    'Average Asset Age (Days)',
    ROUND(AVG(DATEDIFF(NOW(), purchase_date)), 0)
FROM api_asset
WHERE purchase_date IS NOT NULL;
```

## 📈 Data Visualization Queries

### 16. Category Distribution (for Pie Charts)
```sql
-- Asset Distribution by Category
SELECT 
    c.category_name,
    COUNT(a.asset_id) as count,
    ROUND(COUNT(a.asset_id) * 100.0 / (SELECT COUNT(*) FROM api_asset), 2) as percentage
FROM api_category c
LEFT JOIN api_asset a ON c.category_id = a.category_id
GROUP BY c.category_id, c.category_name
ORDER BY count DESC;
```

### 17. Monthly Purchase Trends (for Histograms)
```sql
-- Monthly Asset Purchase Trends
SELECT 
    DATE_FORMAT(purchase_date, '%Y-%m') as month,
    COUNT(*) as assets_purchased,
    SUM(purchase_cost) as total_investment
FROM api_asset
WHERE purchase_date >= DATE_SUB(NOW(), INTERVAL 24 MONTH)
GROUP BY DATE_FORMAT(purchase_date, '%Y-%m')
ORDER BY month;
```

---

## 📊 Report Usage Instructions

### For Text Reports:
1. Copy any SQL query above
2. Run in MySQL Workbench or command line
3. Export results to CSV/Excel for further analysis

### For Graphical Reports:
1. Use queries 16-17 for pie charts and histograms
2. Import data into Excel, Tableau, or Power BI
3. Create visualizations as needed

### For Presentation:
1. Use KPI queries (15) for executive summary
2. Use financial reports (4-6) for budget discussions
3. Use maintenance reports (9-10) for operational insights

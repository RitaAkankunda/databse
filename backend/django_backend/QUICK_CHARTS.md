# Quick Charts for Presentation

## 🎯 EASIEST WAY: Run these queries in MySQL Workbench and use the Chart tab

### 1. Pie Chart - Asset Distribution by Category
```sql
SELECT 
    c.category_name,
    COUNT(a.asset_id) as count
FROM api_category c
LEFT JOIN api_asset a ON c.category_id = a.category_id
GROUP BY c.category_id, c.category_name
ORDER BY count DESC;
```
**Steps:**
1. Run this query
2. Click "Chart" tab
3. Select "Pie Chart"
4. Take screenshot

### 2. Bar Chart - Monthly Purchase Trends
```sql
SELECT 
    DATE_FORMAT(purchase_date, '%Y-%m') as month,
    COUNT(*) as assets_purchased,
    SUM(purchase_cost) as total_investment
FROM api_asset
WHERE purchase_date IS NOT NULL
GROUP BY DATE_FORMAT(purchase_date, '%Y-%m')
ORDER BY month;
```
**Steps:**
1. Run this query
2. Click "Chart" tab
3. Select "Bar Chart"
4. Take screenshot

### 3. Pie Chart - Asset Status Distribution
```sql
SELECT 
    status,
    COUNT(*) as count
FROM api_asset
GROUP BY status;
```
**Steps:**
1. Run this query
2. Click "Chart" tab
3. Select "Pie Chart"
4. Take screenshot

### 4. Bar Chart - Department Asset Distribution
```sql
SELECT 
    u.department,
    COUNT(DISTINCT a.asset_id) as total_assets,
    SUM(a.purchase_cost) as total_value
FROM api_user u
JOIN api_assignment ass ON u.user_id = ass.user_id
JOIN api_asset a ON ass.asset_id = a.asset_id
WHERE ass.return_date IS NULL
GROUP BY u.department
ORDER BY total_value DESC;
```
**Steps:**
1. Run this query
2. Click "Chart" tab
3. Select "Bar Chart"
4. Take screenshot

### 5. Line Chart - Yearly Sales Report
```sql
SELECT 
    YEAR(purchase_date) as year,
    COUNT(*) as assets_purchased,
    SUM(purchase_cost) as total_investment
FROM api_asset
WHERE purchase_date IS NOT NULL
GROUP BY YEAR(purchase_date)
ORDER BY year;
```
**Steps:**
1. Run this query
2. Click "Chart" tab
3. Select "Line Chart"
4. Take screenshot

## 📊 For Your Presentation:

1. **Run each query above**
2. **Create the chart in MySQL Workbench**
3. **Take screenshots**
4. **Add to your PowerPoint/Google Slides**

## 🎯 Alternative: Excel Method (Also Easy)

1. **Export any query result to Excel**
2. **Select the data**
3. **Insert → Chart**
4. **Choose chart type**
5. **Copy chart to presentation**

This is the fastest way to get professional-looking charts for your presentation!

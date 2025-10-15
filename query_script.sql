-- query_script.sql
-- Generic MySQL report script for sales databases
-- Produces: yearly summary, quarterly summary, top customers, top products, monthly trend, and growth vs previous period
-- Usage: edit the table/column mapping section below to match your schema, then run:
--   mysql -u <user> -p -h <host> <database> < query_script.sql
-- Or open it in a MySQL client and run the whole script.

-- ======== Configuration: adjust to your schema ========
-- Default assumptions (change these names if your DB uses different ones):
-- - sales table: sales (id, sale_date, customer_id, product_id, quantity, unit_price, total_amount)
-- - customers table: customers (id, name)
-- - products table: products (id, name)

SET @sales_table = 'sales';
SET @sales_date_col = 'sale_date';
SET @sales_amount_col = 'total_amount';
SET @sales_qty_col = 'quantity';
SET @sales_customer_col = 'customer_id';
SET @sales_product_col = 'product_id';
SET @customers_table = 'customers';
SET @customers_pk = 'id';
SET @customers_name = 'name';
SET @products_table = 'products';
SET @products_pk = 'id';
SET @products_name = 'name';

-- Choose the reporting date range (inclusive). Use ISO dates.
-- Leave empty to report on all data.
SET @report_start_date = NULL; -- e.g. '2023-01-01'
SET @report_end_date = NULL;   -- e.g. '2025-12-31'

-- Helper: build a WHERE clause for dates if start/end provided
SET @date_filter = (
  SELECT IF(
    @report_start_date IS NULL AND @report_end_date IS NULL,
    '1=1',
    CONCAT(
      IF(@report_start_date IS NOT NULL, CONCAT(@sales_date_col, " >= '", @report_start_date, "'"), '1=1'),
      ' AND ',
      IF(@report_end_date IS NOT NULL, CONCAT(@sales_date_col, " <= '", @report_end_date, "'"), '1=1')
    )
  )
);

-- Note: We'll use prepared statements to inject table/column names.

SET @sql = CONCAT(
"SELECT YEAR(s.", @sales_date_col, ") AS year,",
" COUNT(*) AS transactions,",
" SUM(s.", @sales_qty_col, ") AS total_quantity,",
" SUM(s.", @sales_amount_col, ") AS total_revenue",
" FROM ", @sales_table, " s",
" WHERE ", @date_filter,
" GROUP BY YEAR(s.", @sales_date_col, ")",
" ORDER BY YEAR(s.", @sales_date_col, ") DESC;"
);

SELECT '==== Yearly Sales Summary ====' AS _title;
PREPARE stmt_yearly FROM @sql;
EXECUTE stmt_yearly;
DEALLOCATE PREPARE stmt_yearly;

SET @sql = CONCAT(
"SELECT CONCAT(YEAR(s.", @sales_date_col, "), '-Q', QUARTER(s.", @sales_date_col, ")) AS year_quarter,",
" COUNT(*) AS transactions,",
" SUM(s.", @sales_qty_col, ") AS total_quantity,",
" SUM(s.", @sales_amount_col, ") AS total_revenue",
" FROM ", @sales_table, " s",
" WHERE ", @date_filter,
" GROUP BY YEAR(s.", @sales_date_col, "), QUARTER(s.", @sales_date_col, ")",
" ORDER BY YEAR(s.", @sales_date_col, ") DESC, QUARTER(s.", @sales_date_col, ") DESC;"
);

SELECT '==== Quarterly Sales Summary ====' AS _title;
PREPARE stmt_quarterly FROM @sql;
EXECUTE stmt_quarterly;
DEALLOCATE PREPARE stmt_quarterly;

SET @top_n = 10;
SET @sql = CONCAT(
"SELECT c.", @customers_name, " AS customer_name,",
" COUNT(s.id) AS transactions,",
" SUM(s.", @sales_amount_col, ") AS revenue",
" FROM ", @sales_table, " s",
" LEFT JOIN ", @customers_table, " c ON c.", @customers_pk, " = s.", @sales_customer_col,
" WHERE ", @date_filter,
" GROUP BY c.", @customers_name,
" ORDER BY revenue DESC",
" LIMIT ", @top_n, ";"
);

SELECT CONCAT('==== Top ', @top_n, ' Customers by Revenue ====') AS _title;
PREPARE stmt_top_customers FROM @sql;
EXECUTE stmt_top_customers;
DEALLOCATE PREPARE stmt_top_customers;

SET @sql = CONCAT(
"SELECT p.", @products_name, " AS product_name,",
" SUM(s.", @sales_qty_col, ") AS total_quantity,",
" SUM(s.", @sales_amount_col, ") AS revenue",
" FROM ", @sales_table, " s",
" LEFT JOIN ", @products_table, " p ON p.", @products_pk, " = s.", @sales_product_col,
" WHERE ", @date_filter,
" GROUP BY p.", @products_name,
" ORDER BY revenue DESC",
" LIMIT ", @top_n, ";"
);

SELECT CONCAT('==== Top ', @top_n, ' Products by Revenue ====') AS _title;
PREPARE stmt_top_products FROM @sql;
EXECUTE stmt_top_products;
DEALLOCATE PREPARE stmt_top_products;

-- This shows month, transactions, revenue, running 3-month average (simple)
SET @sql = CONCAT(
"SELECT DATE_FORMAT(s.", @sales_date_col, ", '%Y-%m') AS month,",
" COUNT(*) AS transactions,",
" SUM(s.", @sales_amount_col, ") AS revenue",
" FROM ", @sales_table, " s",
" WHERE ", @date_filter,
" GROUP BY DATE_FORMAT(s.", @sales_date_col, ", '%Y-%m')",
" ORDER BY month DESC",
" LIMIT 24;"
);

SELECT '==== Monthly Trend (last 24 months) ====' AS _title;
PREPARE stmt_monthly_trend FROM @sql;
EXECUTE stmt_monthly_trend;
DEALLOCATE PREPARE stmt_monthly_trend;

-- We'll compute revenue by period and the percent growth vs previous period using LAG() (MySQL 8+)

SET @sql = CONCAT(
"WITH period_revenue AS (",
"  SELECT",
"    YEAR(s.", @sales_date_col, ") AS year,",
"    QUARTER(s.", @sales_date_col, ") AS quarter,",
"    CONCAT(YEAR(s.", @sales_date_col, "), '-Q', QUARTER(s.", @sales_date_col, ")) AS period_label,",
"    SUM(s.", @sales_amount_col, ") AS revenue",
"  FROM ", @sales_table, " s",
"  WHERE ", @date_filter,
"  GROUP BY YEAR(s.", @sales_date_col, "), QUARTER(s.", @sales_date_col, ")",
"),",
"yearly AS (",
"  SELECT YEAR(s.", @sales_date_col, ") AS year, SUM(s.", @sales_amount_col, ") AS revenue",
"  FROM ", @sales_table, " s",
"  WHERE ", @date_filter,
"  GROUP BY YEAR(s.", @sales_date_col, ")",
"  ORDER BY YEAR(s.", @sales_date_col, ")
"),",
"q AS (",
"  SELECT *, LAG(revenue) OVER (ORDER BY year, quarter) AS prev_revenue FROM period_revenue",
"  ORDER BY year, quarter",
"),",
"y AS (",
"  SELECT *, LAG(revenue) OVER (ORDER BY year) AS prev_revenue FROM yearly",
"  ORDER BY year",
")",
"SELECT 'Quarterly growth (period, revenue, prev_revenue, pct_change)' AS title;",
" SELECT period_label, revenue, prev_revenue, ROUND((revenue - prev_revenue) / NULLIF(prev_revenue,0) * 100,2) AS pct_change FROM q ORDER BY period_label DESC;",
" SELECT 'Yearly growth (year, revenue, prev_revenue, pct_change)' AS title;",
" SELECT year, revenue, prev_revenue, ROUND((revenue - prev_revenue) / NULLIF(prev_revenue,0) * 100,2) AS pct_change FROM y ORDER BY year DESC;"
);

SELECT '==== Period-over-Period Growth ====' AS _title;
PREPARE stmt_period_growth FROM @sql;
EXECUTE stmt_period_growth;
DEALLOCATE PREPARE stmt_period_growth;

-- ======== Notes ========
-- - If your sales table stores amounts in multiple columns (e.g. unit_price + discount), update @sales_amount_col accordingly or build a payload expression.
-- - If your dataset is large, add an index on the sale_date column for faster reporting: ALTER TABLE sales ADD INDEX (sale_date);
-- - The script uses prepared statements so you can change table/column names at the top easily.

SELECT '==== End of report ====' AS _end;

-- End of query_script.sql

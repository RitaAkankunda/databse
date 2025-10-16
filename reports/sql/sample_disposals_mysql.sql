-- Sample data for disposals (MySQL)
-- Run this in MySQL Workbench connected to your project DB.
-- It inserts assets and buyers, then creates disposals referencing them.

START TRANSACTION;

-- Sample set 1
INSERT INTO api_asset (asset_name, purchase_date, purchase_cost, status, serial_number)
VALUES ('Office Laptop A', '2019-04-12', 250000.00, 'retired', 'SN-LAP-A-001');
SET @a1 = LAST_INSERT_ID();
INSERT INTO api_buyer (name, phone, email)
VALUES ('Acme Resellers Ltd', '0777000001', 'sales@acmeresellers.example');
SET @b1 = LAST_INSERT_ID();
INSERT INTO api_disposal (asset_id, disposal_date, disposal_value, buyer_id, reason)
VALUES (@a1, '2023-05-10', 150000.00, @b1, 'End of life sale');

-- Sample set 2
INSERT INTO api_asset (asset_name, purchase_date, purchase_cost, status, serial_number)
VALUES ('Desktop Workstation B', '2018-11-03', 180000.00, 'disposed', 'SN-DESK-B-002');
SET @a2 = LAST_INSERT_ID();
INSERT INTO api_buyer (name, phone, email)
VALUES ('Local Buyer Co', '0777000002', 'buyer2@example.com');
SET @b2 = LAST_INSERT_ID();
INSERT INTO api_disposal (asset_id, disposal_date, disposal_value, buyer_id, reason)
VALUES (@a2, '2022-12-20', 90000.00, @b2, 'Sold as usable');

-- Sample set 3
INSERT INTO api_asset (asset_name, purchase_date, purchase_cost, status, serial_number)
VALUES ('Projector C', '2017-07-22', 120000.00, 'disposed', 'SN-PROJ-C-003');
SET @a3 = LAST_INSERT_ID();
INSERT INTO api_buyer (name, phone, email)
VALUES ('Event Supplies Ltd', '0777000003', 'events@example.com');
SET @b3 = LAST_INSERT_ID();
INSERT INTO api_disposal (asset_id, disposal_date, disposal_value, buyer_id, reason)
VALUES (@a3, '2024-02-15', 40000.00, @b3, 'Sold at auction');

-- Sample set 4
INSERT INTO api_asset (asset_name, purchase_date, purchase_cost, status, serial_number)
VALUES ('Office Chair D', '2016-01-05', 20000.00, 'disposed', 'SN-CHAIR-D-004');
SET @a4 = LAST_INSERT_ID();
INSERT INTO api_buyer (name, phone, email)
VALUES ('Furniture Outlet', '0777000004', 'furniture@example.com');
SET @b4 = LAST_INSERT_ID();
INSERT INTO api_disposal (asset_id, disposal_date, disposal_value, buyer_id, reason)
VALUES (@a4, '2021-09-30', 5000.00, @b4, 'Scrapped - recyclable parts');

-- Sample set 5
INSERT INTO api_asset (asset_name, purchase_date, purchase_cost, status, serial_number)
VALUES ('Server Rack E', '2015-06-18', 500000.00, 'disposed', 'SN-RACK-E-005');
SET @a5 = LAST_INSERT_ID();
INSERT INTO api_buyer (name, phone, email)
VALUES ('IT Recycling Hub', '0777000005', 'recycle@example.com');
SET @b5 = LAST_INSERT_ID();
INSERT INTO api_disposal (asset_id, disposal_date, disposal_value, buyer_id, reason)
VALUES (@a5, '2020-04-10', 250000.00, @b5, 'Recycled under contract');

-- Sample set 6
INSERT INTO api_asset (asset_name, purchase_date, purchase_cost, status, serial_number)
VALUES ('Spare Parts Kit F', '2020-03-11', 30000.00, 'disposed', 'SN-KIT-F-006');
SET @a6 = LAST_INSERT_ID();
INSERT INTO api_buyer (name, phone, email)
VALUES ('Parts Trader', '0777000006', 'parts@example.com');
SET @b6 = LAST_INSERT_ID();
INSERT INTO api_disposal (asset_id, disposal_date, disposal_value, buyer_id, reason)
VALUES (@a6, '2024-07-01', 12000.00, @b6, 'Sold as parts');

COMMIT;

-- Show inserted disposals
SELECT disposal_id, asset_id, disposal_date, disposal_value, buyer_id, reason FROM api_disposal ORDER BY disposal_date DESC LIMIT 20;

-- After running this file, run the reports script to populate report tables:
-- mysql -u your_user -p -D your_database < "C:/path/to/databse/reports/sql/sales_report_mysql.sql"

-- Demo data for Admin Masters system
-- Insert sample data for all master tables

-- Entities Master
INSERT INTO entities (name, code, description, address, contact_person, contact_email, contact_phone) VALUES
('Kandhari Global Beverages Ltd', 'KGB', 'Parent company and headquarters', 'Tower A, Business Park, Mumbai 400001', 'Rajesh Kandhari', 'rajesh@kandhari.com', '+91-22-6789-0123'),
('KGB Production Unit', 'KGBP', 'Main production facility', 'Industrial Zone, Pune 411019', 'Suresh Patel', 'suresh.patel@kandhari.com', '+91-20-5678-9012'),
('KGB Distribution Center', 'KGBD', 'Central distribution hub', 'Logistics Park, Delhi 110020', 'Priya Sharma', 'priya.sharma@kandhari.com', '+91-11-4567-8901'),
('KGB South Region', 'KGBS', 'Southern operations', 'Tech City, Bangalore 560001', 'Arun Kumar', 'arun.kumar@kandhari.com', '+91-80-3456-7890');

-- Departments Master
INSERT INTO departments (name, code, description, head_name, head_email, budget_allocated, entity_id) VALUES
('Production', 'PROD', 'Manufacturing and production operations', 'Vikram Singh', 'vikram.singh@kandhari.com', 5000000, 1),
('Quality Control', 'QC', 'Quality assurance and testing', 'Dr. Meena Agarwal', 'meena.agarwal@kandhari.com', 800000, 1),
('Sales & Marketing', 'SM', 'Sales and marketing activities', 'Rohit Gupta', 'rohit.gupta@kandhari.com', 2500000, 1),
('Finance', 'FIN', 'Financial planning and accounting', 'Kavita Nair', 'kavita.nair@kandhari.com', 1200000, 1),
('Human Resources', 'HR', 'Employee management and development', 'Sanjay Joshi', 'sanjay.joshi@kandhari.com', 900000, 1),
('Information Technology', 'IT', 'IT infrastructure and systems', 'Amit Verma', 'amit.verma@kandhari.com', 1500000, 1),
('Supply Chain', 'SC', 'Procurement and logistics', 'Neha Reddy', 'neha.reddy@kandhari.com', 3000000, 1),
('Research & Development', 'RD', 'Product development and innovation', 'Dr. Kiran Patel', 'kiran.patel@kandhari.com', 2000000, 1);

-- Locations Master
INSERT INTO locations (name, code, address, city, state, pincode, country, facility_type, entity_id) VALUES
('Mumbai Head Office', 'MHO', 'Tower A, Business Park, Andheri East', 'Mumbai', 'Maharashtra', '400001', 'India', 'Corporate Office', 1),
('Delhi Regional Office', 'DRO', 'Block C, Corporate Plaza, Connaught Place', 'Delhi', 'Delhi', '110020', 'India', 'Regional Office', 3),
('Bangalore Production Unit', 'BPU', 'Industrial Area, Electronics City Phase 2', 'Bangalore', 'Karnataka', '560001', 'India', 'Manufacturing', 4),
('Chennai Distribution Center', 'CDC', 'Warehouse Complex, Sriperumbudur', 'Chennai', 'Tamil Nadu', '602105', 'India', 'Distribution', 3),
('Pune Manufacturing Plant', 'PMP', 'MIDC Industrial Area, Bhosari', 'Pune', 'Maharashtra', '411019', 'India', 'Manufacturing', 2),
('Hyderabad Regional Office', 'HRO', 'Cyber Towers, HITEC City', 'Hyderabad', 'Telangana', '500081', 'India', 'Regional Office', 4);

-- Roles Master
INSERT INTO roles (name, code, description, permissions, hierarchy_level, reports_to) VALUES
('System Administrator', 'SYSADM', 'Full system access and configuration', '["all"]', 1, NULL),
('Group Admin', 'GRPADM', 'Entity-level administration', '["entity_admin", "user_management", "reporting"]', 2, 1),
('Department Manager', 'DEPTMGR', 'Department-level management', '["dept_mgmt", "approve_requests", "team_mgmt"]', 3, 2),
('Team Lead', 'TEAMLD', 'Team leadership and coordination', '["team_coord", "approve_small", "reporting"]', 4, 3),
('Senior Executive', 'SENEXE', 'Senior level operations', '["create_requests", "view_reports", "approve_minor"]', 5, 4),
('Executive', 'EXEC', 'Standard executive level', '["create_requests", "view_own"]', 6, 5),
('Junior Executive', 'JREXE', 'Entry level executive', '["create_basic", "view_own"]', 7, 6),
('Contractor', 'CONTR', 'External contractor access', '["limited_access"]', 8, 6);

-- Approval Matrix with approver employee number and name
INSERT INTO approval_matrix (department, location, level, approver_employee_number, approver_name, min_amount, max_amount, is_active)
VALUES
('Production', 'Mumbai Head Office', 1, 'EMP008', 'Priya', 0, 50000, true),
('Production', 'Mumbai Head Office', 2, 'EMP009', 'Ravi', 50001, 200000, true),
('Quality Control', 'Bangalore Production Unit', 1, 'EMP1003', 'Amit Kumar', 0, 25000, true),
('Quality Control', 'Bangalore Production Unit', 2, 'EMP1004', 'Sunita Reddy', 25001, 100000, true),
('Production', 'Mumbai Head Office', 200001, 500000, 'GRPADM', 3, true, 5),
('Production', 'Mumbai Head Office', 500001, 9999999, 'SYSADM', 4, true, 7),
('Quality Control', 'Bangalore Production Unit', 100001, 9999999, 'GRPADM', 3, true, 4),
('Information Technology', 'Mumbai Head Office', 100001, 300000, 'DEPTMGR', 2, true, 3),
('Information Technology', 'Mumbai Head Office', 300001, 9999999, 'GRPADM', 3, true, 5);

-- Escalation Matrix
INSERT INTO escalation_matrix (department, location, approval_level, escalation_hours, escalate_to_role, notification_template, is_active) VALUES
('Production', 'Mumbai Head Office', 1, 48, 'DEPTMGR', 'Level 1 approval overdue', true),
('Production', 'Mumbai Head Office', 2, 72, 'GRPADM', 'Level 2 approval overdue', true),
('Production', 'Mumbai Head Office', 3, 120, 'SYSADM', 'Level 3 approval overdue', true),
('Quality Control', 'Bangalore Production Unit', 1, 24, 'DEPTMGR', 'QC approval pending', true),
('Quality Control', 'Bangalore Production Unit', 2, 48, 'GRPADM', 'QC department approval overdue', true),
('Information Technology', 'Mumbai Head Office', 1, 48, 'DEPTMGR', 'IT approval pending', true),
('Information Technology', 'Mumbai Head Office', 2, 72, 'GRPADM', 'IT approval overdue', true),
('Finance', 'Mumbai Head Office', 1, 24, 'DEPTMGR', 'Finance approval urgent', true),
('Finance', 'Mumbai Head Office', 2, 48, 'GRPADM', 'Finance approval escalated', true);

-- Inventory Master
INSERT INTO inventory (item_code, item_name, category, unit_of_measure, current_stock, minimum_stock, maximum_stock, unit_price, supplier_name, location) VALUES
('RAW001', 'Sugar - Premium Grade', 'Raw Material', 'Kg', 5000, 1000, 10000, 45.50, 'Sweet Solutions Pvt Ltd', 'Pune Manufacturing Plant'),
('RAW002', 'Natural Flavoring Concentrate', 'Raw Material', 'Liters', 500, 100, 800, 1250.00, 'Flavor Masters India', 'Bangalore Production Unit'),
('RAW003', 'Carbonated Water', 'Raw Material', 'Liters', 10000, 2000, 15000, 2.50, 'Aqua Pure Systems', 'Pune Manufacturing Plant'),
('PKG001', 'PET Bottles 500ml', 'Packaging', 'Units', 50000, 10000, 100000, 3.75, 'Plastic Containers Co', 'Chennai Distribution Center'),
('PKG002', 'Labels - Premium Print', 'Packaging', 'Units', 25000, 5000, 40000, 0.85, 'Label Tech Solutions', 'Mumbai Head Office'),
('EQP001', 'Bottling Machine Filter', 'Equipment', 'Units', 10, 2, 15, 15000.00, 'Industrial Equipment Ltd', 'Pune Manufacturing Plant'),
('EQP002', 'Quality Testing Kit', 'Equipment', 'Sets', 5, 1, 8, 75000.00, 'Lab Solutions India', 'Bangalore Production Unit'),
('OFF001', 'Office Stationery Kit', 'Office Supplies', 'Sets', 100, 20, 200, 850.00, 'Office Mart', 'Mumbai Head Office'),
('ITM001', 'Laptop - Business Grade', 'IT Equipment', 'Units', 15, 5, 25, 55000.00, 'Tech Solutions Pro', 'Mumbai Head Office'),
('ITM002', 'Network Switch 24-Port', 'IT Equipment', 'Units', 8, 2, 12, 25000.00, 'Network Systems Ltd', 'Delhi Regional Office');

-- Vendors Master
INSERT INTO vendors (vendor_code, vendor_name, category, contact_person, email, phone, address, city, state, pincode, gst_number, pan_number, payment_terms, credit_limit, rating) VALUES
('VND001', 'Sweet Solutions Pvt Ltd', 'Raw Materials', 'Ramesh Kumar', 'ramesh@sweetsolutions.com', '+91-98765-43210', 'Industrial Area, Sector 15', 'Gurgaon', 'Haryana', '122001', '07ABCDE1234F1Z5', 'ABCDE1234F', 'Net 30', 500000, 4.5),
('VND002', 'Flavor Masters India', 'Raw Materials', 'Sunita Patel', 'sunita@flavormasters.in', '+91-87654-32109', 'Chemical Complex, GIDC', 'Vadodara', 'Gujarat', '390020', '24FGHIJ5678K2A1', 'FGHIJ5678K', 'Net 45', 800000, 4.8),
('VND003', 'Aqua Pure Systems', 'Raw Materials', 'Rajesh Sharma', 'rajesh@aquapure.com', '+91-76543-21098', 'Water Treatment Plant Road', 'Nashik', 'Maharashtra', '422001', '27LMNOP9012P3B2', 'LMNOP9012P', 'Net 15', 300000, 4.2),
('VND004', 'Plastic Containers Co', 'Packaging', 'Priya Singh', 'priya@plasticcontainers.com', '+91-65432-10987', 'Plastic Industrial Estate', 'Chennai', 'Tamil Nadu', '600058', '33QRSTU3456Q4C3', 'QRSTU3456Q', 'Net 30', 750000, 4.6),
('VND005', 'Label Tech Solutions', 'Packaging', 'Amit Verma', 'amit@labeltech.in', '+91-54321-09876', 'Printing Hub, Phase 2', 'Noida', 'Uttar Pradesh', '201301', '09VWXYZ7890R5D4', 'VWXYZ7890R', 'Net 30', 400000, 4.4),
('VND006', 'Industrial Equipment Ltd', 'Equipment', 'Kavita Reddy', 'kavita@indequip.com', '+91-43210-98765', 'Heavy Machinery Complex', 'Coimbatore', 'Tamil Nadu', '641001', '33ABCDE2345S6E5', 'ABCDE2345S', 'Net 60', 2000000, 4.7),
('VND007', 'Lab Solutions India', 'Equipment', 'Dr. Suresh Iyer', 'suresh@labsolutions.in', '+91-32109-87654', 'Scientific Instrument Park', 'Pune', 'Maharashtra', '411057', '27FGHIJ6789T7F6', 'FGHIJ6789T', 'Net 45', 1500000, 4.9),
('VND008', 'Office Mart', 'Office Supplies', 'Neha Gupta', 'neha@officemart.com', '+91-21098-76543', 'Commercial Plaza, Sector 18', 'Gurgaon', 'Haryana', '122015', '07LMNOP4567U8G7', 'LMNOP4567U', 'Net 15', 150000, 4.1),
('VND009', 'Tech Solutions Pro', 'IT Equipment', 'Rohit Jain', 'rohit@techsolutions.pro', '+91-10987-65432', 'IT Park, Electronic City', 'Bangalore', 'Karnataka', '560100', '29QRSTU8901V9H8', 'QRSTU8901V', 'Net 30', 1200000, 4.8),
('VND010', 'Network Systems Ltd', 'IT Equipment', 'Sanjay Kumar', 'sanjay@networksystems.com', '+91-09876-54321', 'Tech Tower, Cyber City', 'Hyderabad', 'Telangana', '500081', '36VWXYZ2345W0I9', 'VWXYZ2345W', 'Net 45', 800000, 4.5);

-- Users (add two new approvers)
INSERT INTO users (employee_number, full_name, email, mobile, department, location, password, role, is_active)
VALUES
('EMP008', 'Priya', 'priya@kandhari.com', '+91-90000-00001', 'IT', 'Mumbai Head Office', 'password', 'approver', true),
('EMP009', 'Ravi', 'ravi@kandhari.com', '+91-90000-00002', 'Finance', 'Mumbai Head Office', 'password', 'approver', true);
('EMP010', 'Saraha', 'saraha@kandhari.com', '+91-90000-00003', 'IT', 'Mumbai Head Office', 'password', 'approver', true),
('EMP011', 'Rajesh', 'rajesh@kandhari.com', '+91-90000-00004', 'Finance', 'Mumbai Head Office', 'password', 'approver', true);

-- Approval Workflow (IT, Mumbai Head Office, 2 levels)
INSERT INTO approval_workflow (department, location, approval_level, approver_id, is_active)
VALUES
('IT', 'Mumbai Head Office', 1, (SELECT id FROM users WHERE email='priya@kandhari.com'), true),
('IT', 'Mumbai Head Office', 2, (SELECT id FROM users WHERE email='saraha@kandhari.com'), true),
('Finance', 'Bangalore - Production Unit', 1, (SELECT id FROM users WHERE email='ravi@kandhari.com'), true),
('Finance', 'Bangalore - Production Unit', 2, (SELECT id FROM users WHERE email='rajesh@kandhari.com'), true);

-- Update approval_matrix table
ALTER TABLE approval_matrix
  ADD COLUMN approver_employee_number VARCHAR(50) NOT NULL,
  ADD COLUMN approver_name VARCHAR(255) NOT NULL;

-- (Optional) If you want to remove the old 'role' column:
-- ALTER TABLE approval_matrix DROP COLUMN role;
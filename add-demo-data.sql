-- Demo data for Kandhari Global Beverages Purchase Request System

-- Insert sample purchase requests
INSERT INTO purchase_requests (
  requisition_number, title, request_date, department, location, 
  business_justification_code, business_justification_details, 
  status, current_approval_level, total_estimated_cost, requester_id
) VALUES 
-- Recent requests for different departments
('KGB-2025-IT-001', 'New Laptop Computers for Development Team', '2025-01-15', 'IT', 'Mumbai HQ', 'Equipment Replacement', 'Current laptops are 4+ years old and affecting productivity. Development team needs high-performance machines for software development.', 'pending', 1, '450000.00', 5),

('KGB-2025-MKT-002', 'Marketing Campaign Materials for New Product Launch', '2025-01-14', 'Sales & Marketing', 'Mumbai HQ', 'Business Growth', 'Marketing materials needed for Q1 2025 product launch including brochures, banners, and promotional items for trade shows.', 'approved', 3, '125000.00', 3),

('KGB-2025-QC-003', 'Laboratory Testing Equipment Upgrade', '2025-01-13', 'Quality Control', 'Pune Plant', 'Equipment Replacement', 'Current testing equipment is outdated and requires frequent maintenance. New equipment will improve testing accuracy and efficiency.', 'pending', 2, '875000.00', 2),

('KGB-2025-FIN-004', 'Office Furniture for New Finance Team', '2025-01-12', 'Finance', 'Mumbai HQ', 'Team Expansion', 'Additional workstations and furniture required for 5 new finance team members joining next month.', 'approved', 3, '85000.00', 4),

('KGB-2025-IT-005', 'Network Infrastructure Upgrade', '2025-01-10', 'IT', 'Delhi Branch', 'Infrastructure Improvement', 'Upgrading network switches and routers to support increased bandwidth requirements and improve security.', 'under_review', 1, '325000.00', 5),

('KGB-2025-MKT-006', 'Digital Advertising Campaign Budget', '2025-01-08', 'Sales & Marketing', 'Mumbai HQ', 'Business Growth', 'Digital marketing campaign for social media and online advertising to increase brand awareness in Q1 2025.', 'rejected', 2, '200000.00', 3);

-- Insert line items for the purchase requests
INSERT INTO line_items (
  purchase_request_id, item_name, required_quantity, unit_of_measure, 
  required_by_date, delivery_location, estimated_cost, item_justification
) VALUES 
-- Items for Laptop request (ID 1)
(1, 'Dell XPS 15 Developer Edition Laptop', 8, 'pieces', '2025-02-15', 'Mumbai HQ - IT Department', '50000.00', 'High-performance laptops with 32GB RAM and SSD for development work'),
(1, 'External 4K Monitors', 8, 'pieces', '2025-02-15', 'Mumbai HQ - IT Department', '25000.00', 'Additional screen space for coding and debugging'),
(1, 'Laptop Docking Stations', 8, 'pieces', '2025-02-15', 'Mumbai HQ - IT Department', '15000.00', 'Enable easy connection to external peripherals'),

-- Items for Marketing Campaign (ID 2)
(2, 'Promotional Brochures (Premium Print)', 5000, 'pieces', '2025-02-01', 'Mumbai HQ - Marketing', '35000.00', 'High-quality brochures for product launch events'),
(2, 'Trade Show Banner Stands', 10, 'pieces', '2025-01-25', 'Mumbai HQ - Marketing', '45000.00', 'Portable banner displays for exhibitions'),
(2, 'Promotional Gift Items (Branded)', 1000, 'pieces', '2025-02-05', 'Mumbai HQ - Marketing', '45000.00', 'Corporate gifts for potential clients'),

-- Items for Lab Equipment (ID 3)
(3, 'Spectrophotometer UV-Vis', 1, 'unit', '2025-03-01', 'Pune Plant - QC Lab', '450000.00', 'Advanced testing equipment for beverage quality analysis'),
(3, 'pH Meter Digital (Lab Grade)', 3, 'units', '2025-02-20', 'Pune Plant - QC Lab', '75000.00', 'Precise pH measurement for quality control'),
(3, 'Microbiological Incubator', 2, 'units', '2025-03-01', 'Pune Plant - QC Lab', '350000.00', 'Temperature-controlled environment for bacterial testing'),

-- Items for Office Furniture (ID 4)
(4, 'Ergonomic Office Chairs', 5, 'pieces', '2025-02-01', 'Mumbai HQ - Finance Floor', '12000.00', 'Comfortable seating for new team members'),
(4, 'Height-Adjustable Desks', 5, 'pieces', '2025-02-01', 'Mumbai HQ - Finance Floor', '25000.00', 'Modern workstations with adjustable height'),
(4, 'Filing Cabinets (4-Drawer)', 3, 'pieces', '2025-02-01', 'Mumbai HQ - Finance Floor', '18000.00', 'Document storage for financial records'),

-- Items for Network Upgrade (ID 5)
(5, 'Enterprise Network Switch (48-port)', 3, 'units', '2025-02-10', 'Delhi Branch - Server Room', '125000.00', 'High-performance switches for network backbone'),
(5, 'Wireless Access Points (Wi-Fi 6)', 12, 'units', '2025-02-10', 'Delhi Branch - Various Floors', '60000.00', 'Modern wireless connectivity throughout office'),
(5, 'Network Security Appliance', 1, 'unit', '2025-02-10', 'Delhi Branch - Server Room', '140000.00', 'Enhanced security for network traffic'),

-- Items for Digital Campaign (ID 6)
(6, 'Google Ads Campaign Budget', 1, 'campaign', '2025-01-20', 'Online Platform', '80000.00', 'Targeted advertising for beverage products'),
(6, 'Social Media Promotion Package', 1, 'package', '2025-01-20', 'Multiple Platforms', '70000.00', 'Instagram, Facebook, and LinkedIn advertising'),
(6, 'Content Creation Services', 1, 'package', '2025-01-20', 'Digital Agency', '50000.00', 'Professional video and graphic content');

-- Insert approval history for processed requests
INSERT INTO approval_history (
  purchase_request_id, approver_id, action, comments, approval_level, action_date
) VALUES 
-- Marketing Campaign approvals (approved)
(2, 2, 'approved', 'Marketing strategy looks solid. Approved for Q1 launch.', 1, '2025-01-14 10:30:00'),
(2, 4, 'approved', 'Budget allocation confirmed. Finance approved.', 2, '2025-01-14 14:15:00'),
(2, 1, 'approved', 'Final approval granted. Proceed with procurement.', 3, '2025-01-15 09:00:00'),

-- Office Furniture approvals (approved)
(4, 2, 'approved', 'Team expansion justified. Approved.', 1, '2025-01-12 11:00:00'),
(4, 4, 'approved', 'Budget within limits. Finance approved.', 2, '2025-01-12 15:30:00'),
(4, 1, 'approved', 'Final approval for new team setup.', 3, '2025-01-13 08:45:00'),

-- Digital Campaign rejection
(6, 2, 'approved', 'Campaign concept approved for review.', 1, '2025-01-08 13:20:00'),
(6, 4, 'rejected', 'Budget exceeds Q1 marketing allocation. Please revise and resubmit with reduced scope.', 2, '2025-01-09 16:00:00'),

-- Partial approval for Lab Equipment
(3, 2, 'approved', 'Equipment upgrade is necessary for quality standards.', 1, '2025-01-13 12:00:00');

-- Insert some notifications
INSERT INTO notifications (
  user_id, purchase_request_id, title, message, type, is_read, created_at
) VALUES 
-- Notifications for pending approvals
(2, 1, 'New Purchase Request Awaiting Approval', 'IT Laptop purchase request KGB-2025-IT-001 requires your approval.', 'approval_request', false, '2025-01-15 09:30:00'),
(4, 1, 'Purchase Request in Queue', 'IT Laptop request KGB-2025-IT-001 is pending your finance review.', 'pending_review', false, '2025-01-15 09:35:00'),
(2, 5, 'New Purchase Request Awaiting Approval', 'Network Infrastructure upgrade KGB-2025-IT-005 requires your approval.', 'approval_request', false, '2025-01-10 11:00:00'),

-- Notifications for completed actions
(3, 2, 'Purchase Request Approved', 'Your marketing campaign request KGB-2025-MKT-002 has been fully approved!', 'approval_completed', true, '2025-01-15 09:05:00'),
(4, 4, 'Purchase Request Approved', 'Your office furniture request KGB-2025-FIN-004 has been approved.', 'approval_completed', true, '2025-01-13 08:50:00'),
(3, 6, 'Purchase Request Rejected', 'Your digital advertising request KGB-2025-MKT-006 was rejected. Please see comments for details.', 'approval_rejected', false, '2025-01-09 16:30:00'),

-- System notifications
(1, NULL, 'Monthly Report Available', 'December 2024 purchase request summary report is now available.', 'system_update', true, '2025-01-01 10:00:00'),
(5, 5, 'Request Status Update', 'Your network upgrade request KGB-2025-IT-005 is now under technical review.', 'status_update', false, '2025-01-11 14:20:00');
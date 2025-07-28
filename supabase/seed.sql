-- Seed data for categories
INSERT INTO categories (name, type, description) VALUES
  ('Office Supplies', 'expense', 'Expenses for office materials and supplies'),
  ('Marketing', 'expense', 'Marketing and advertising expenses'),
  ('Utilities', 'expense', 'Utility bills and services'),
  ('Travel', 'expense', 'Business travel expenses'),
  ('Consulting', 'income', 'Revenue from consulting services'),
  ('Product Sales', 'income', 'Revenue from product sales'),
  ('Licensing', 'income', 'Licensing and royalty income');

-- Create subcategories
INSERT INTO categories (name, type, description, parent_category_id) VALUES
  ('Social Media Ads', 'expense', 'Social media advertising expenses',
   (SELECT id FROM categories WHERE name = 'Marketing')),
  ('Print Advertising', 'expense', 'Print and traditional advertising',
   (SELECT id FROM categories WHERE name = 'Marketing')),
  ('Electricity', 'expense', 'Electricity bills',
   (SELECT id FROM categories WHERE name = 'Utilities')),
  ('Internet', 'expense', 'Internet and telecommunications',
   (SELECT id FROM categories WHERE name = 'Utilities'));

-- Seed data for payees
INSERT INTO payees (name, description, contact_info) VALUES
  ('ABC Corporation', 'Major client for consulting services',
   '{"email": "contact@abccorp.com", "phone": "+1-555-0123", "address": "123 Business St, City, State 12345"}'),
  ('Office Depot', 'Office supplies vendor',
   '{"email": "orders@officedepot.com", "phone": "+1-555-0456", "website": "officedepot.com"}'),
  ('Google Ads', 'Online advertising platform',
   '{"email": "support@google.com", "website": "ads.google.com"}'),
  ('City Electric Company', 'Local electricity provider',
   '{"email": "billing@cityelectric.com", "phone": "+1-555-0789", "account": "ACC-789456"}'),
  ('Freelancer John Smith', 'Independent contractor for design work',
   '{"email": "john.smith@email.com", "phone": "+1-555-0321", "portfolio": "johnsmithdesign.com"}'),
  ('XYZ Software Inc', 'Software licensing and services',
   '{"email": "licensing@xyzsoftware.com", "phone": "+1-555-0654", "website": "xyzsoftware.com"}')
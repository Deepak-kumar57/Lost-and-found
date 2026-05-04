-- password for both users: Password123!
INSERT INTO users (name,email,password_hash,role) VALUES
('Admin User','admin@example.com', crypt('Password123!', gen_salt('bf', 12)),'admin'),
('Student User','student@example.com', crypt('Password123!', gen_salt('bf', 12)),'user')
ON CONFLICT (email) DO NOTHING;
INSERT INTO lost_items (user_id,title,description,category,location,date_lost,status) VALUES
((SELECT id FROM users WHERE email='student@example.com'),'Black Wallet','Black leather wallet with student ID inside.','Wallet','Library','2026-04-15','approved')
ON CONFLICT DO NOTHING;
INSERT INTO found_items (finder_id,title,description,category,location,date_found,status,handover_instructions) VALUES
((SELECT id FROM users WHERE email='student@example.com'),'Silver Keys','A set of three silver keys with a blue keychain.','Keys','Main Cafeteria','2026-04-18','approved','Collect from admin office after verification')
ON CONFLICT DO NOTHING;

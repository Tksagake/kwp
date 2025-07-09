-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Counties table
CREATE TABLE IF NOT EXISTS counties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Waste pickers table
CREATE TABLE IF NOT EXISTS waste_pickers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  reg_id text NOT NULL UNIQUE,
  mobile_number text NOT NULL,
  county text NOT NULL,
  email text NOT NULL UNIQUE,
  id_number text NOT NULL UNIQUE,
  profile_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (county) REFERENCES counties(name) ON UPDATE CASCADE
);

-- County managers table
CREATE TABLE IF NOT EXISTS county_managers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  username text NOT NULL UNIQUE,
  mobile_number text NOT NULL,
  county text NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (county) REFERENCES counties(name) ON UPDATE CASCADE
);

-- Contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id uuid NOT NULL,
  amount decimal(10,2) NOT NULL,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('Monthly', 'Donation', 'Other')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (member_id) REFERENCES waste_pickers(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  message text NOT NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('waste_picker', 'county_manager', 'all_waste_pickers', 'all_managers')),
  recipient_id uuid,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_pickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE county_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users (admin access)
CREATE POLICY "Enable all access for authenticated users" ON counties FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON waste_pickers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON county_managers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON contributions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users" ON notifications FOR ALL TO authenticated USING (true);

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);

-- Storage policy for profile images
CREATE POLICY "Enable all access for authenticated users" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'profile-images');

-- Insert sample counties
INSERT INTO counties (name, code) VALUES
  ('Nairobi', 'NBI'),
  ('Nakuru', 'NKU'),
  ('Kisumu', 'KSM'),
  ('Trans Nzoia', 'TNZ'),
  ('Mombasa', 'MBA'),
  ('Kiambu', 'KBU'),
  ('Machakos', 'MCK'),
  ('Uasin Gishu', 'UGS'),
  ('Meru', 'MRU'),
  ('Nyeri', 'NYR');

-- Insert sample waste pickers
INSERT INTO waste_pickers (first_name, last_name, reg_id, mobile_number, county, email, id_number) VALUES
  ('John', 'Kamau', 'WP001', '+254712345678', 'Nairobi', 'john.kamau@example.com', '12345678'),
  ('Mary', 'Wanjiku', 'WP002', '+254723456789', 'Nakuru', 'mary.wanjiku@example.com', '23456789'),
  ('Peter', 'Ochieng', 'WP003', '+254734567890', 'Kisumu', 'peter.ochieng@example.com', '34567890'),
  ('Grace', 'Muthoni', 'WP004', '+254745678901', 'Trans Nzoia', 'grace.muthoni@example.com', '45678901'),
  ('David', 'Kiprop', 'WP005', '+254756789012', 'Nairobi', 'david.kiprop@example.com', '56789012'),
  ('Sarah', 'Njeri', 'WP006', '+254767890123', 'Mombasa', 'sarah.njeri@example.com', '67890123'),
  ('James', 'Mutua', 'WP007', '+254778901234', 'Kiambu', 'james.mutua@example.com', '78901234'),
  ('Agnes', 'Cherop', 'WP008', '+254789012345', 'Uasin Gishu', 'agnes.cherop@example.com', '89012345'),
  ('Samuel', 'Njoroge', 'WP009', '+254790123456', 'Meru', 'samuel.njoroge@example.com', '90123456'),
  ('Faith', 'Wambui', 'WP010', '+254701234567', 'Nyeri', 'faith.wambui@example.com', '01234567'),
  ('Michael', 'Otieno', 'WP011', '+254711234567', 'Kisumu', 'michael.otieno@example.com', '11234567'),
  ('Jane', 'Akinyi', 'WP012', '+254722234567', 'Nairobi', 'jane.akinyi@example.com', '22234567');

-- Insert sample county managers
INSERT INTO county_managers (first_name, last_name, username, mobile_number, county, email) VALUES
  ('Robert', 'Mwangi', 'rmwangi', '+254700111222', 'Nairobi', 'robert.mwangi@kenwapwa.org'),
  ('Alice', 'Chepkemoi', 'achepkemoi', '+254700222333', 'Nakuru', 'alice.chepkemoi@kenwapwa.org'),
  ('Daniel', 'Owino', 'dowino', '+254700333444', 'Kisumu', 'daniel.owino@kenwapwa.org'),
  ('Lucy', 'Wamalwa', 'lwamalwa', '+254700444555', 'Trans Nzoia', 'lucy.wamalwa@kenwapwa.org'),
  ('Francis', 'Omondi', 'fomondi', '+254700555666', 'Mombasa', 'francis.omondi@kenwapwa.org'),
  ('Joyce', 'Karanja', 'jkaranja', '+254700666777', 'Kiambu', 'joyce.karanja@kenwapwa.org'),
  ('Emmanuel', 'Musyoki', 'emusyoki', '+254700777888', 'Machakos', 'emmanuel.musyoki@kenwapwa.org'),
  ('Mercy', 'Rutto', 'mrutto', '+254700888999', 'Uasin Gishu', 'mercy.rutto@kenwapwa.org'),
  ('Vincent', 'Mburu', 'vmburu', '+254700999000', 'Meru', 'vincent.mburu@kenwapwa.org'),
  ('Catherine', 'Wanjiru', 'cwanjiru', '+254700000111', 'Nyeri', 'catherine.wanjiru@kenwapwa.org');

-- Insert sample contributions
INSERT INTO contributions (member_id, amount, date, type, description) VALUES
  ((SELECT id FROM waste_pickers WHERE reg_id = 'WP001'), 500.00, '2024-01-15', 'Monthly', 'January membership fee'),
  ((SELECT id FROM waste_pickers WHERE reg_id = 'WP002'), 750.00, '2024-01-20', 'Donation', 'Equipment fund donation'),
  ((SELECT id FROM waste_pickers WHERE reg_id = 'WP003'), 500.00, '2024-02-15', 'Monthly', 'February membership fee'),
  ((SELECT id FROM waste_pickers WHERE reg_id = 'WP004'), 1000.00, '2024-02-10', 'Other', 'Training program contribution'),
  ((SELECT id FROM waste_pickers WHERE reg_id = 'WP005'), 500.00, '2024-03-15', 'Monthly', 'March membership fee'),
  ((SELECT id FROM waste_pickers WHERE reg_id = 'WP001'), 500.00, '2024-02-15', 'Monthly', 'February membership fee'),
  ((SELECT id FROM waste_pickers WHERE reg_id = 'WP002'), 500.00, '2024-03-15', 'Monthly', 'March membership fee'),
  ((SELECT id FROM waste_pickers WHERE reg_id = 'WP006'), 300.00, '2024-01-25', 'Donation', 'Community project support'),
  ((SELECT id FROM waste_pickers WHERE reg_id = 'WP007'), 500.00, '2024-01-15', 'Monthly', 'January membership fee'),
  ((SELECT id FROM waste_pickers WHERE reg_id = 'WP008'), 500.00, '2024-02-15', 'Monthly', 'February membership fee');

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update triggers
CREATE TRIGGER update_waste_pickers_updated_at BEFORE UPDATE ON waste_pickers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_county_managers_updated_at BEFORE UPDATE ON county_managers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_counties_updated_at BEFORE UPDATE ON counties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON contributions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
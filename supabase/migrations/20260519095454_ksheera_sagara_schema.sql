/*
  # Ksheera-Sagara Dairy Farm Management Schema

  ## Overview
  Complete schema for managing dairy farm operations including:
  - Farmer profiles and farm details
  - Cow/cattle management
  - Daily milk production entries
  - Expense tracking with categories
  - Analytics support

  ## Tables

  ### 1. profiles
  - Farmer profile linked to auth.users
  - Stores name, phone, farm name, language preference

  ### 2. cows
  - Individual cow records per farm
  - Breed, age, lactation status

  ### 3. milk_entries
  - Daily milk production records
  - Liters, fat%, SNF, rate, and calculated income

  ### 4. expenses
  - Farm expense records
  - Categories: Feed, Medicine, Labor, Electricity, Transport, Other

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  farm_name text DEFAULT 'My Farm',
  location text DEFAULT '',
  language text DEFAULT 'en',
  dark_mode boolean DEFAULT false,
  total_cows integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Cows table
CREATE TABLE IF NOT EXISTS cows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  tag_number text DEFAULT '',
  breed text DEFAULT 'Local',
  age_months integer DEFAULT 0,
  weight_kg numeric(6,2) DEFAULT 0,
  is_lactating boolean DEFAULT true,
  lactation_number integer DEFAULT 1,
  purchase_date date,
  purchase_price numeric(10,2) DEFAULT 0,
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cows"
  ON cows FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cows"
  ON cows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cows"
  ON cows FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cows"
  ON cows FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Milk entries table
CREATE TABLE IF NOT EXISTS milk_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cow_id uuid REFERENCES cows(id) ON DELETE SET NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  session text NOT NULL DEFAULT 'morning' CHECK (session IN ('morning', 'evening')),
  liters numeric(6,2) NOT NULL DEFAULT 0,
  fat_percent numeric(4,2) DEFAULT 0,
  snf_percent numeric(4,2) DEFAULT 0,
  rate_per_liter numeric(6,2) NOT NULL DEFAULT 0,
  income numeric(10,2) GENERATED ALWAYS AS (liters * rate_per_liter) STORED,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE milk_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milk entries"
  ON milk_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milk entries"
  ON milk_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own milk entries"
  ON milk_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own milk entries"
  ON milk_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('feed', 'medicine', 'labor', 'electricity', 'transport', 'other')),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  description text DEFAULT '',
  vendor text DEFAULT '',
  receipt_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_milk_entries_user_date ON milk_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_cows_user ON cows(user_id);

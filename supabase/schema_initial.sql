-- ============================================================================
-- Makerspace Equipment Catalog - Initial Schema
-- Run as a single block. If anything fails, the entire transaction rolls back.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Enum types (fixed lists of allowed values)
-- ----------------------------------------------------------------------------

CREATE TYPE equipment_location AS ENUM (
  'Rapid Fabrication 104',
  'Woodshop 105',
  'Metal Shop 107',
  'Paint Booth',
  'Other'
);

CREATE TYPE equipment_status AS ENUM (
  'Operational',
  'Maintenance',
  'Down',
  'Other'
);

CREATE TYPE equipment_link_type AS ENUM (
  'manual',
  'video',
  'vendor',
  'project_example',
  'other'
);

-- ----------------------------------------------------------------------------
-- 2. Equipment table
-- ----------------------------------------------------------------------------

CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Public-facing fields
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  manufacturer TEXT,
  model TEXT,
  unit_identifier TEXT,
  location equipment_location NOT NULL,
  description TEXT,
  photo_url TEXT,
  status equipment_status NOT NULL DEFAULT 'Operational',
  expected_return_date DATE,
  staff_only BOOLEAN NOT NULL DEFAULT FALSE,

  -- Admin-only fields (hidden from public pages via application logic)
  serial_number TEXT,
  purchase_date DATE,
  vendor TEXT,
  warranty_expires DATE,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX equipment_slug_idx ON equipment(slug);
CREATE INDEX equipment_location_idx ON equipment(location);

-- ----------------------------------------------------------------------------
-- 3. Equipment links table (manuals, videos, vendor pages, etc.)
-- ----------------------------------------------------------------------------

CREATE TABLE equipment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  link_type equipment_link_type NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX equipment_links_equipment_id_idx ON equipment_links(equipment_id);

-- ----------------------------------------------------------------------------
-- 4. Auto-update updated_at on equipment row changes
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. Row Level Security
-- ----------------------------------------------------------------------------

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_links ENABLE ROW LEVEL SECURITY;

-- Public can read equipment that isn't marked staff_only
CREATE POLICY "Public can view non-staff equipment"
  ON equipment
  FOR SELECT
  TO anon, authenticated
  USING (staff_only = FALSE);

-- Public can read links belonging to non-staff-only equipment
CREATE POLICY "Public can view links for non-staff equipment"
  ON equipment_links
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM equipment
      WHERE equipment.id = equipment_links.equipment_id
        AND equipment.staff_only = FALSE
    )
  );

-- NOTE: No INSERT/UPDATE/DELETE policies yet. Writes via the public API are
-- blocked. You can still add/edit data via the Supabase Table Editor, which
-- uses a privileged service role that bypasses RLS.
-- We'll add write policies when we set up staff authentication.

COMMIT;
-- Grant the API roles permission to read from the public tables.
-- RLS policies (already in place) will filter which rows they can see.
GRANT SELECT ON equipment TO anon, authenticated;
GRANT SELECT ON equipment_links TO anon, authenticated;
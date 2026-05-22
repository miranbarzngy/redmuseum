-- Showcase Cards table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS showcase_cards (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ku     TEXT        NOT NULL DEFAULT '',
  title_en     TEXT        NOT NULL DEFAULT '',
  title_ar     TEXT        NOT NULL DEFAULT '',
  image_url    TEXT        NOT NULL,
  redirect_url TEXT        NOT NULL DEFAULT '',
  order_index  INT         NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE showcase_cards ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by admin API)
CREATE POLICY "Service role full access on showcase_cards"
  ON showcase_cards
  USING (true)
  WITH CHECK (true);

-- Public read for active cards
CREATE POLICY "Public read active showcase_cards"
  ON showcase_cards
  FOR SELECT
  USING (is_active = true);

-- Storage policies for showcase bucket
-- Run these if you cannot toggle the bucket to Public in the dashboard

INSERT INTO storage.buckets (id, name, public)
  VALUES ('showcase', 'showcase', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read showcase storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'showcase');

CREATE POLICY "Auth upload showcase storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'showcase');

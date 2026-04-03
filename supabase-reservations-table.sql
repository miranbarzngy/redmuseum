-- Create reservations table
CREATE TABLE public.reservations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  phone       TEXT NOT NULL,
  date        DATE NOT NULL,
  time        TIME NOT NULL,
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'visited')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Visitors (anon) can insert reservations
CREATE POLICY "visitors can insert" ON public.reservations
  FOR INSERT TO anon WITH CHECK (true);

-- Authenticated admin can read all
CREATE POLICY "admin can select" ON public.reservations
  FOR SELECT TO authenticated USING (true);

-- Authenticated admin can update status
CREATE POLICY "admin can update" ON public.reservations
  FOR UPDATE TO authenticated USING (true);

-- Authenticated admin can delete
CREATE POLICY "admin can delete" ON public.reservations
  FOR DELETE TO authenticated USING (true);

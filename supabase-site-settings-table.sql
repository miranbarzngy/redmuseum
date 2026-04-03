-- Generic site settings table
CREATE TABLE public.site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Default: visitor tab is visible
INSERT INTO public.site_settings (key, value) VALUES ('show_visitor_tab', 'true');

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings (sidebar needs this without auth)
CREATE POLICY "public can read settings" ON public.site_settings
  FOR SELECT TO anon USING (true);

-- Admin can update settings
CREATE POLICY "admin can update settings" ON public.site_settings
  FOR UPDATE TO authenticated USING (true);

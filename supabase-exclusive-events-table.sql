-- Create exclusive_events table
CREATE TABLE public.exclusive_events (
    id SERIAL PRIMARY KEY,
    title_ku TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description_ku TEXT,
    description_en TEXT,
    description_ar TEXT,
    is_active BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.exclusive_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for everyone
CREATE POLICY "Allow read access for all users" ON public.exclusive_events
FOR SELECT USING (true);

-- Create policy to allow insert/update/delete for authenticated users only
CREATE POLICY "Allow insert for authenticated users" ON public.exclusive_events
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.exclusive_events
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON public.exclusive_events
FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exclusive_events_updated_at 
    BEFORE UPDATE ON public.exclusive_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default record
INSERT INTO public.exclusive_events (
    title_ku, title_en, title_ar,
    description_ku, description_en, description_ar,
    is_active, link
) VALUES (
    'ڕووداوی تایبەت',
    'Exclusive Event',
    'حدث حصري',
    'ئەم ڕووداوەی تایبەتە بۆ نیشاندانی ڕووداوی تایبەتی مۆزەخانەکە.',
    'This exclusive event is for showcasing special museum events.',
    'يتم استخدام هذا الحدث الحصري لعرض الأحداث الخاصة للمتحف.',
    false,
    null
);
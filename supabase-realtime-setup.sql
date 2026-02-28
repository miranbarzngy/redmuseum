-- Supabase Realtime Setup
-- Run this SQL in your Supabase SQL Editor to enable Realtime for the required tables
-- Note: Some tables may already be enabled, which is fine
-- Enable Realtime for slides table (if not already enabled)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
        AND tablename = 'slides'
) THEN ALTER PUBLICATION supabase_realtime
ADD TABLE slides;
END IF;
END $$;
-- Enable Realtime for gallery table (if not already enabled)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
        AND tablename = 'gallery'
) THEN ALTER PUBLICATION supabase_realtime
ADD TABLE gallery;
END IF;
END $$;
-- Enable Realtime for settings table (if not already enabled)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
        AND tablename = 'settings'
) THEN ALTER PUBLICATION supabase_realtime
ADD TABLE settings;
END IF;
END $$;
-- Enable Realtime for messages table (if not already enabled)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
        AND tablename = 'messages'
) THEN ALTER PUBLICATION supabase_realtime
ADD TABLE messages;
END IF;
END $$;
-- Verify the publications
SELECT *
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
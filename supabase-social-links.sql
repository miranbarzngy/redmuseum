-- Add social_json column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS social_json JSONB DEFAULT '[]'::jsonb;

-- Enable RLS on the column if RLS is enabled
-- (RLS should already be enabled on settings table)

-- Insert sample social links data if not exists
-- This will update the existing settings row if there is one
UPDATE settings 
SET social_json = '[
  {
    "id": "1",
    "platform_name": "Facebook",
    "url": "https://facebook.com/amnasuraka",
    "icon_name": "Facebook"
  },
  {
    "id": "2",
    "platform_name": "Instagram",
    "url": "https://instagram.com/amnasuraka",
    "icon_name": "Instagram"
  },
  {
    "id": "3",
    "platform_name": "YouTube",
    "url": "https://youtube.com/@amnasuraka",
    "icon_name": "Youtube"
  },
  {
    "id": "4",
    "platform_name": "TikTok",
    "url": "https://tiktok.com/@amnasuraka",
    "icon_name": "Music"
  }
]'::jsonb
WHERE id = 1;

-- If no settings row exists, insert one
INSERT INTO settings (id, social_json)
SELECT 1, '[
  {
    "id": "1",
    "platform_name": "Facebook",
    "url": "https://facebook.com/amnasuraka",
    "icon_name": "Facebook"
  },
  {
    "id": "2",
    "platform_name": "Instagram",
    "url": "https://instagram.com/amnasuraka",
    "icon_name": "Instagram"
  },
  {
    "id": "3",
    "platform_name": "YouTube",
    "url": "https://youtube.com/@amnasuraka",
    "icon_name": "Youtube"
  },
  {
    "id": "4",
    "platform_name": "TikTok",
    "url": "https://tiktok.com/@amnasuraka",
    "icon_name": "Music"
  }
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);

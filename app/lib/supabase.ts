/**
 * Database type definitions for Supabase
 * Based on the SQL table schemas:
 * - supabase-slides-table.sql
 * - supabase-gallery-table.sql
 * - supabase-messages-table.sql
 */

// =============================================
// SLIDES TABLE
// =============================================
export type Slides = {
  id: number;
  slide_number: number;
  title: string;
  title_kr: string | null;
  subtitle: string | null;
  subtitle_kr: string | null;
  description: string | null;
  description_kr: string | null;
  background_image: string;
  museum_image: string | null;
  video_url: string | null;
  is_active: boolean;
  created_at: string; // TIMESTAMP WITH TIME ZONE
};

export type SlidesInsert = Omit<Slides, 'id' | 'created_at'>;
export type SlidesUpdate = Partial<Omit<Slides, 'id' | 'created_at'>>;

// =============================================
// GALLERY TABLE
// =============================================
export type GalleryCategory = 'visitor' | 'activity' | 'delegation' | 'donation';

export type Gallery = {
  id: number;
  category: GalleryCategory;
  image_url: string;
  title: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string; // TIMESTAMP WITH TIME ZONE
};

export type GalleryInsert = Omit<Gallery, 'id' | 'created_at'>;
export type GalleryUpdate = Partial<Omit<Gallery, 'id' | 'created_at'>>;

// =============================================
// MESSAGES TABLE
// =============================================
export type Messages = {
  id: number;
  name: string;
  phone: string | null;
  email: string;
  message: string;
  created_at: string; // TIMESTAMP WITH TIME ZONE
};

export type MessagesInsert = Omit<Messages, 'id' | 'created_at'>;
export type MessagesUpdate = Partial<Omit<Messages, 'id' | 'created_at'>>;

// =============================================
// DATABASE TYPE
// =============================================
export type Database = {
  public: {
    Tables: {
      slides: {
        Row: Slides;
        Insert: SlidesInsert;
        Update: SlidesUpdate;
      };
      gallery: {
        Row: Gallery;
        Insert: GalleryInsert;
        Update: GalleryUpdate;
      };
      messages: {
        Row: Messages;
        Insert: MessagesInsert;
        Update: MessagesUpdate;
      };
    };
  };
};

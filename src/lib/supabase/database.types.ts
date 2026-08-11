export type ContactRequestType = "commission" | "media" | "other";
export type BookingStatus = "pending" | "confirmed" | "checked_in" | "cancelled" | "no_show";

export interface Database {
  public: {
    Tables: {
      paintings: {
        Row: {
          id: string;
          title_ku: string;
          title_en: string;
          title_ar: string;
          description_ku: string;
          description_en: string;
          description_ar: string;
          medium_ku: string;
          medium_en: string;
          medium_ar: string;
          image_url: string | null;
          category_id: string;
          year: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title_ku: string;
          title_en: string;
          title_ar: string;
          description_ku?: string;
          description_en?: string;
          description_ar?: string;
          medium_ku?: string;
          medium_en?: string;
          medium_ar?: string;
          image_url?: string | null;
          category_id: string;
          year: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["paintings"]["Insert"]>;
        Relationships: [];
      };
      painting_categories: {
        Row: {
          id: string;
          slug: string;
          label_ku: string;
          label_en: string;
          label_ar: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          label_ku: string;
          label_en: string;
          label_ar: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["painting_categories"]["Insert"]>;
        Relationships: [];
      };
      press_media: {
        Row: {
          id: string;
          title_ku: string;
          title_en: string;
          title_ar: string;
          excerpt_ku: string;
          excerpt_en: string;
          excerpt_ar: string;
          source: string;
          url: string;
          date: string;
          category_id: string;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title_ku: string;
          title_en: string;
          title_ar: string;
          excerpt_ku?: string;
          excerpt_en?: string;
          excerpt_ar?: string;
          source: string;
          url: string;
          date: string;
          category_id: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["press_media"]["Insert"]>;
        Relationships: [];
      };
      press_categories: {
        Row: {
          id: string;
          slug: string;
          label_ku: string;
          label_en: string;
          label_ar: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          label_ku: string;
          label_en: string;
          label_ar: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["press_categories"]["Insert"]>;
        Relationships: [];
      };
      exhibitions: {
        Row: {
          id: string;
          title_ku: string;
          title_en: string;
          title_ar: string;
          details_ku: string;
          details_en: string;
          details_ar: string;
          year: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title_ku: string;
          title_en: string;
          title_ar: string;
          details_ku?: string;
          details_en?: string;
          details_ar?: string;
          year: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exhibitions"]["Insert"]>;
        Relationships: [];
      };
      admins: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["admins"]["Insert"]>;
        Relationships: [];
      };
      site_profile: {
        Row: {
          id: number;
          eyebrow_ku: string | null;
          eyebrow_en: string | null;
          eyebrow_ar: string | null;
          name_ku: string | null;
          name_en: string | null;
          name_ar: string | null;
          statement_ku: string | null;
          statement_en: string | null;
          statement_ar: string | null;
          history_ku: string | null;
          history_en: string | null;
          history_ar: string | null;
          stat_museums_value: string | null;
          stat_museums_label: string | null;
          stat_archive_value: string | null;
          stat_archive_label: string | null;
          stat_activities_value: string | null;
          stat_activities_label: string | null;
          stat_visitors_value: string | null;
          stat_visitors_label: string | null;
          hero_image_url: string | null;
          hero_image_urls: string[];
          contact_card_image_url: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          eyebrow_ku?: string | null;
          eyebrow_en?: string | null;
          eyebrow_ar?: string | null;
          name_ku?: string | null;
          name_en?: string | null;
          name_ar?: string | null;
          statement_ku?: string | null;
          statement_en?: string | null;
          statement_ar?: string | null;
          history_ku?: string | null;
          history_en?: string | null;
          history_ar?: string | null;
          stat_museums_value?: string | null;
          stat_museums_label?: string | null;
          stat_archive_value?: string | null;
          stat_archive_label?: string | null;
          stat_activities_value?: string | null;
          stat_activities_label?: string | null;
          stat_visitors_value?: string | null;
          stat_visitors_label?: string | null;
          hero_image_url?: string | null;
          hero_image_urls?: string[];
          contact_card_image_url?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["site_profile"]["Insert"]>;
        Relationships: [];
      };
      biography_intro: {
        Row: {
          id: number;
          eyebrow_ku: string | null;
          eyebrow_en: string | null;
          eyebrow_ar: string | null;
          heading_ku: string | null;
          heading_en: string | null;
          heading_ar: string | null;
          intro_ku: string | null;
          intro_en: string | null;
          intro_ar: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          eyebrow_ku?: string | null;
          eyebrow_en?: string | null;
          eyebrow_ar?: string | null;
          heading_ku?: string | null;
          heading_en?: string | null;
          heading_ar?: string | null;
          intro_ku?: string | null;
          intro_en?: string | null;
          intro_ar?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["biography_intro"]["Insert"]>;
        Relationships: [];
      };
      biography_blocks: {
        Row: {
          id: string;
          body_ku: string;
          body_en: string;
          body_ar: string;
          image_url: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          body_ku?: string;
          body_en?: string;
          body_ar?: string;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["biography_blocks"]["Insert"]>;
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          phone: string;
          type: ContactRequestType;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          type: ContactRequestType;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contact_messages"]["Insert"]>;
        Relationships: [];
      };
      tributes: {
        Row: {
          id: string;
          title_ku: string;
          title_en: string;
          title_ar: string;
          person_name: string;
          details_ku: string;
          details_en: string;
          details_ar: string;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title_ku: string;
          title_en: string;
          title_ar: string;
          person_name: string;
          details_ku: string;
          details_en: string;
          details_ar: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tributes"]["Insert"]>;
        Relationships: [];
      };
      admin_push_tokens: {
        Row: {
          id: string;
          token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          token: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_push_tokens"]["Insert"]>;
        Relationships: [];
      };
      system_settings: {
        Row: {
          id: number;
          enable_face_scan: boolean;
          updated_at: string;
        };
        Insert: {
          id?: number;
          enable_face_scan?: boolean;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["system_settings"]["Insert"]>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          name: string;
          phone: string;
          visit_date: string;
          note: string | null;
          face_vector_data: number[] | null;
          face_scan_consent: boolean;
          status: BookingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          visit_date: string;
          note?: string | null;
          face_vector_data?: number[] | null;
          face_scan_consent?: boolean;
          status?: BookingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [];
      };
      page_visits: {
        Row: {
          id: string;
          path: string;
          country: string | null;
          city: string | null;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          path: string;
          country?: string | null;
          city?: string | null;
          ip_hash?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["page_visits"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_admin_login_attempt: {
        Args: { client_ip: string };
        Returns: boolean;
      };
      record_page_visit: {
        Args: { p_path: string; p_country?: string | null; p_city?: string | null; p_ip_hash?: string | null };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type PaintingRow = Database["public"]["Tables"]["paintings"]["Row"];
export type PaintingInsert = Database["public"]["Tables"]["paintings"]["Insert"];
export type PaintingCategoryRow = Database["public"]["Tables"]["painting_categories"]["Row"];
export type PaintingCategoryInsert = Database["public"]["Tables"]["painting_categories"]["Insert"];
export type PressMediaRow = Database["public"]["Tables"]["press_media"]["Row"];
export type PressMediaInsert = Database["public"]["Tables"]["press_media"]["Insert"];
export type PressCategoryRow = Database["public"]["Tables"]["press_categories"]["Row"];
export type PressCategoryInsert = Database["public"]["Tables"]["press_categories"]["Insert"];
export type ExhibitionRow = Database["public"]["Tables"]["exhibitions"]["Row"];
export type ExhibitionInsert = Database["public"]["Tables"]["exhibitions"]["Insert"];
export type SiteProfileRow = Database["public"]["Tables"]["site_profile"]["Row"];
export type SiteProfileInsert = Database["public"]["Tables"]["site_profile"]["Insert"];
export type BiographyIntroRow = Database["public"]["Tables"]["biography_intro"]["Row"];
export type BiographyIntroInsert = Database["public"]["Tables"]["biography_intro"]["Insert"];
export type BiographyBlockRow = Database["public"]["Tables"]["biography_blocks"]["Row"];
export type BiographyBlockInsert = Database["public"]["Tables"]["biography_blocks"]["Insert"];
export type ContactMessageRow = Database["public"]["Tables"]["contact_messages"]["Row"];
export type ContactMessageInsert = Database["public"]["Tables"]["contact_messages"]["Insert"];
export type TributeRow = Database["public"]["Tables"]["tributes"]["Row"];
export type TributeInsert = Database["public"]["Tables"]["tributes"]["Insert"];
export type AdminPushTokenRow = Database["public"]["Tables"]["admin_push_tokens"]["Row"];
export type AdminPushTokenInsert = Database["public"]["Tables"]["admin_push_tokens"]["Insert"];
export type SystemSettingsRow = Database["public"]["Tables"]["system_settings"]["Row"];
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];

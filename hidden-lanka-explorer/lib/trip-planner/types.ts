export type LocationPoint = {
  name: string;
  latitude: number;
  longitude: number;
  district?: string;
};

export type TransportMode = "driving" | "walking" | "cycling" | "transit";

export type AccommodationTier = "budget" | "mid_range" | "luxury";

export type TripPace = "relaxed" | "moderate" | "packed";

export type TimeSlot = "morning" | "afternoon" | "sunset";

export type PlaceRecord = {
  id: string;
  name: string;
  slug: string;
  district: string;
  nearest_town?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  short_description?: string | null;
  description?: string | null;
  hidden_tips?: string | null;
  safety_tips?: string | null;
  warnings?: string | null;
  hero_image_url?: string | null;
  image_url?: string | null;
  latitude: number;
  longitude: number;
  difficulty?: string | null;
  best_season?: string | null;
  visit_duration?: string | null;
  entrance_fee?: string | null;
  transport?: string | null;
  road_condition?: string | null;
  activities?: string[] | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  like_count?: number | null;
  // Computed values
  distance_km?: number;
  estimated_drive_minutes?: number;
  match_score?: number;
  match_reasons?: string[];
};

export type TripDestination = {
  id: string;
  trip_id: string;
  place_id: string;
  day_number: number;
  order_index: number;
  visit_time_slot: TimeSlot;
  planned_date?: string | null;
  notes?: string | null;
  is_visited: boolean;
  visited_at?: string | null;
  place?: PlaceRecord;
};

export type TripPreference = {
  id?: string;
  trip_id?: string;
  interests: string[];
  preferred_districts: string[];
  preferred_categories: string[];
  pace: TripPace;
  accommodation_tier: AccommodationTier;
};

export type ExpenseCategory =
  | "transport"
  | "accommodation"
  | "food"
  | "entrance_fees"
  | "activities"
  | "other";

export type TripExpense = {
  id: string;
  trip_id: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  is_estimated: boolean;
  notes?: string | null;
};

export type Trip = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  start_location_name: string;
  start_latitude: number;
  start_longitude: number;
  start_date?: string | null;
  end_date?: string | null;
  duration_days: number;
  traveler_count: number;
  budget_currency: string;
  total_budget: number;
  estimated_cost: number;
  transport_mode: TransportMode;
  status: "planning" | "ongoing" | "completed" | "cancelled";
  is_public: boolean;
  share_token?: string;
  created_at: string;
  updated_at: string;
  // Joined relation fields
  destinations?: TripDestination[];
  preferences?: TripPreference;
  expenses?: TripExpense[];
  members?: TripMember[];
};

export type TripMember = {
  id: string;
  trip_id: string;
  user_id: string;
  role: "owner" | "editor" | "viewer";
  invited_email?: string | null;
  status: "pending" | "accepted";
  user_name?: string;
  user_avatar?: string;
};

export type NotificationType =
  | "trip_reminder"
  | "destination_reminder"
  | "weather_alert"
  | "place_recommendation"
  | "general";

export type InAppNotification = {
  id: string;
  user_id: string;
  trip_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

export type TripReminder = {
  id: string;
  trip_id: string;
  user_id: string;
  place_id?: string | null;
  reminder_type: "trip_departure" | "packing" | "visit_stop" | "safety_alert";
  reminder_date: string;
  title: string;
  notes?: string | null;
  is_triggered: boolean;
  created_at?: string;
};

export type RouteLeg = {
  fromName: string;
  toName: string;
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][]; // [lat, lng]
};

export type RoutePlan = {
  totalDistanceKm: number;
  totalDurationMinutes: number;
  legs: RouteLeg[];
  fullPolyline: [number, number][];
  isOsrm: boolean;
};


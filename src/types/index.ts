export interface LocalBusiness {
  position?: number;
  ludocid?: string;
  place_id?: string;
  data_id?: string;
  title?: string;
  address?: string;
  phone?: string;
  rating?: number;
  reviews?: number;
  reviews_histogram?: Record<string, number>;
  type?: string;
  types?: string[];
  website?: string;
  thumbnail?: string;
  images?: string[] | Array<{ title?: string; thumbnail?: string }>;
  gps_coordinates?: {
    latitude: number;
    longitude: number;
  };
  open_state?: string;
  hours?: string;
  open_hours?: Record<string, string>;
  description?: string;
  extensions?: Array<{
    title?: string;
    items?: Array<{ title?: string; value?: string }>;
  }>;
}

export interface GoogleMapsSearchResponse {
  search_metadata?: {
    id: string;
    status: string;
    created_at: string;
  };
  search_parameters?: {
    engine: string;
    q: string;
    ll?: string;
    hl?: string;
    gl?: string;
  };
  search_information?: {
    query_displayed?: string;
    state?: string;
  };
  local_results?: LocalBusiness[];
  error?: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  businessName: string;
  keyword: string;
  location: string;
  coordinates?: string;
  placeId?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  projectId?: string;
  query: string;
  location: string;
  coordinates?: string;
  results: LocalBusiness[];
  createdAt: string;
}

export interface SeoAudit {
  id: string;
  userId: string;
  projectId?: string;
  businessName: string;
  keyword: string;
  location: string;
  targetBusiness?: LocalBusiness;
  competitors: LocalBusiness[];
  analysis: string;
  score?: number;
  recommendations: string[];
  createdAt: string;
}

export interface DashboardStats {
  projects: number;
  searches: number;
  audits: number;
}

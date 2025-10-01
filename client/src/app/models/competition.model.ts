export interface Competition {
  id: string;
  name: string;
  description?: string;
  date: string;
  location?: string;
  organizer?: string;
  contact?: string;
  entry_fee?: string;
  prizes?: string;
  schedule?: string;
  rules_equipment?: string;
  general_rules?: string;
  cover_image?: string;
  participants_per_sector?: number;
  created_at: string;
  updated_at: string;
  participant_count?: number;
  sector_count?: number;
}

export interface CompetitionDetails {
  competition: Competition;
  sectors: Sector[];
  participants: Participant[];
}

export interface Sector {
  id: string;
  competition_id: string;
  name: string;
  max_participants: number;
  created_at: string;
  participant_count?: number;
  available_spots?: number;
}

export interface Participant {
  id: string;
  competition_id: string;
  sector_id?: string;
  name: string;
  created_at: string;
  sector_name?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  total_weight?: number;
  weigh_in_count?: number;
}

export interface WeighIn {
  id: string;
  participant_id: string;
  weight_grams: number;
  notes?: string;
  created_at: string;
  participant_name?: string;
  sector_name?: string;
}

export interface SectorResult {
  sector_id: string;
  sector_name: string;
  participant_id: string;
  participant_name: string;
  total_weight: number;
  sector_rank: number;
  sector_points: number;
}

export interface OverallResult {
  participant_id: string;
  participant_name: string;
  sector_name: string;
  total_weight: number;
  sector_points: number;
  overall_rank: number;
}

export interface CompetitionSummary {
  competition_name: string;
  competition_date: string;
  sector_count: number;
  participant_count: number;
  total_catch_weight: number;
  total_weigh_ins: number;
}

export interface CompetitionWizardData {
  name: string;
  description?: string;
  date: string;
  location?: string;
  organizer?: string;
  contact?: string;
  entry_fee?: string;
  prizes?: string;
  schedule?: string;
  rules_equipment?: string;
  general_rules?: string;
  cover_image?: string;
  sector_count: number;
  participants_per_sector: number;
}

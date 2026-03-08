// ── Shared data types ──
// Single source of truth for all entities across the platform.
// When the backend is connected, these map 1:1 to the Prisma models.

export type AssetType = "image" | "video" | "document" | "audio";
export type PostStatus = "idea" | "allocated" | "editing" | "approved" | "posted";
export type CampaignStatus = "active" | "planning" | "upcoming" | "completed";
export type TeamRole = "admin" | "editor" | "viewer";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  size?: string;
  date?: string;
  tags: string[];
  thumbnail?: string;
}

export interface Post {
  id: string;
  title: string;
  platform: string;
  postType: string;
  status: PostStatus;
  priority: string;
  assignee: string;
  event: string;
  scheduledDate: string;
  scheduledTime: string;
  caption: string;
  notes: string;
  tags: string[];
  linkedAssetIds: string[];
  campaignId?: string;
}

export interface Campaign {
  id: string;
  name: string;
  date: string;
  venue: string;
  city: string;
  status: CampaignStatus;
  headcount: number;
  budget: number;
  ticketsSold: number;
  ticketGoal: number;
}

export interface CalculatorEvent {
  name: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  artists: { name: string; fee: number; travel: number }[];
  venueFee: number;
  barMin: number;
  audioHW: number;
  visualHW: number;
  showVenueStaff: boolean;
  venueStaff: { role: string; rate: number; count: number }[];
  showProdStaff: boolean;
  prodStaff: { role: string; rate: number; count: number }[];
  paidAds: number;
  contentGen: number;
  headcount: number;
  margin: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
}

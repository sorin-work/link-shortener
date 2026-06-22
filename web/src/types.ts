export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

export interface Link {
  id: number;
  slug: string;
  shortUrl: string;
  url: string;
  title: string | null;
  clicks: number;
  expiresAt: string | null;
  expired: boolean;
  maxClicks: number | null;
  clickCount: number;
  status: 'active' | 'paused' | 'expired' | 'limit_reached';
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LinkPage {
  links: Link[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface NamedCount {
  name: string;
  clicks: number;
}

export interface LinkStats {
  range: { days: number; from: string; to: string };
  total: number;
  bots: number;
  includeBots: boolean;
  byDay: { date: string; clicks: number }[];
  referrers: NamedCount[];
  devices: NamedCount[];
  browsers: NamedCount[];
  os: NamedCount[];
  countries: NamedCount[];
}

export interface LinkInput {
  url: string;
  slug?: string;
  title?: string | null;
  expiresAt?: string | null;
  maxClicks?: number | null;
  password?: string | null;
  paused?: boolean;
}

export interface Overview {
  links: number;
  clicksThisWeek: number;
  clicksLastWeek: number;
  topLinks: { id: number; slug: string; title: string | null; clicks: number }[];
}

export interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface FieldError {
  path: string;
  message: string;
}

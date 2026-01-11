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

export interface LinkInput {
  url: string;
  slug?: string;
  title?: string | null;
}

export interface FieldError {
  path: string;
  message: string;
}

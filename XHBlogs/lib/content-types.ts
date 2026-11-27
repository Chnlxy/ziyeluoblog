export interface PostSummary {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  cover: string;
}

export interface MomentSummary {
  id: string;
  date: string;
  location: string;
  images: string[];
  content: string;
}

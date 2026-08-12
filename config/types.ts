export interface SiteConfig {
  site: {
    name: string;
    title: string;
    description: string;
    logo: string;
  };
  profile: {
    name: string;
    title: string;
    email: string;
    department: string;
    university: string;
    profileImage: string;
    researchInterests?: string[];
  };
  social: {
    googleScholar: string;
    twitter: string;
    linkedin: string;
    github?: string;
  };
  navigation: Array<{ name: string; href: string }>;
  aboutDescription: string;
  news: Array<{
    id: string;
    date: string;
    content: string;
    link?: string;
  }>;
  publications: Array<{
    id: string;
    year: number;
    title: string;
    authors: string;
    venue: string;
    selected?: boolean;
    image?: string;
    links?: {
      pdf?: string;
      code?: string;
      data?: string;
      project?: string;
      doi?: string;
    };
  }>;
  education: Array<{
    id: string;
    period: string;
    location: string;
    degree: string;
    institution: string;
    supervisor?: string;
    logo?: string;
  }>;
  experience: Array<{
    coords?: [number, number];
    id: string;
    period: string;
    location: string;
    position: string;
    institution: string;
    supervisor?: string;
    logo?: string;
  }>;
  awards: Array<{
    id: string;
    year: string;
    title: string;
    description?: string;
  }>;
  lifeCategories: Array<{
    id: string;
    name: string;
    nameZh: string;
    unit: { zh: string; one: string; many: string };
    views?: Array<"list" | "calendar" | "timeline">;
    kindFilter?: boolean;
    emoji: string;
    description: string;
    descriptionZh: string;
    cover: string;
  }>;
  lifeLinks: Array<{
    href: string;
    name: string;
    nameZh: string;
    emoji: string;
    description: string;
    descriptionZh: string;
    cover: string;
  }>;
  service: {
    conferenceReviewing: Array<{ name: string; years: string }>;
    journalReviewing: Array<{ name: string; years: string }>;
    communityService: Array<{
      id: string;
      role: string;
      organization: string;
      period: string;
      description?: string;
    }>;
  };
}


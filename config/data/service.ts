import type { SiteConfig } from "../types";

export const awards: SiteConfig["awards"] = [
  { id: "award-2024-1", year: "2024", title: "National Scholarship", description: "Ministry of Education China" },
  { id: "award-2024-2", year: "2024", title: "The Third Prize of the \"Lu Zengyong CAD&CG High-Tech Award\"", description: "The Lu Zengyong CAD&CG Committee" },
  { id: "award-2024-3", year: "2024", title: "Inclusive Scholarship", description: "IEEE VIS, Tampa, USA" },
  { id: "award-2024-4", year: "2024", title: "Outstanding PhD Dissertation Funding", description: "Zhejiang University" },
  { id: "award-2023-1", year: "2023", title: "PhD Rising Star", description: "Zhejiang University" },
  { id: "award-2023-2", year: "2023", title: "Chinese Government Scholarship", description: "China Scholarship Council" },
  { id: "award-2023-3", year: "2023", title: "Excellence in Academic Innovation", description: "Zhejiang University" },
  { id: "award-2023-4", year: "2023", title: "Award of Honor for Graduate", description: "Zhejiang University" },
  { id: "award-2020-1", year: "2020", title: "Outstanding Graduate Award", description: "Zhejiang University" },
  { id: "award-2018-1", year: "2018", title: "National Scholarship", description: "Ministry of Education China" },
];

export const service: SiteConfig["service"] = {
  conferenceReviewing: [
    { name: "IEEE VIS", years: "2022 - 2026" },
    { name: "PacificVis", years: "2022 - 2026" },
    { name: "ChinaVis", years: "2022 - 2026" },
    { name: "CHI", years: "2023 - 2026" },
  ],
  journalReviewing: [
    { name: "IEEE Transactions on Visualization and Computer Graphics (TVCG)", years: "" },
  ],
  communityService: [
    {
      id: "service-2024-vis",
      role: "Student Volunteer & T-shirt Designer",
      organization: "IEEE VIS",
      period: "2024",
      description: "Virtual",
    },
    {
      id: "service-2024-eurovis",
      role: "Student Volunteer",
      organization: "EuroVis",
      period: "2024",
      description: "Odense, Denmark",
    },
  ],
};


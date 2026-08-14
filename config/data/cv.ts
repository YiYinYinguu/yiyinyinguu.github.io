import type { SiteConfig } from "../types";
import { SHOW_UNIVERSITY_OF_VIENNA } from "./profile";

export const education: SiteConfig["education"] = [
  {
    id: "edu-phd",
    period: "09/2020 - 12/2025",
    location: "Hangzhou, China",
    degree: "Ph. D.",
    institution: "State Key Lab of CAD&CG, Zhejiang University",
    supervisor: "Supervised by Prof. Yingcai Wu",
    logo: "/logos/zju.png",
  },
  {
    id: "edu-undergrad",
    period: "09/2016 - 06/2020",
    location: "Hangzhou, China",
    degree: "Undergraduate",
    institution: "College of Computer Science, Zhejiang University",
    supervisor: "Bachelor in Digital Media Technology",
    logo: "/logos/zju.png",
  },
];

const allExperience: SiteConfig["experience"] = [
  {
    id: "exp-univie",
    period: "09/2026 -",
    location: "Vienna, Austria",
    coords: [16.37, 48.21],
    position: "Postdoctoral Researcher (Incoming)",
    institution: "University of Vienna",
    supervisor: "Working with Prof. Torsten Möller",
    logo: "/logos/univie.png",
  },
  {
    id: "exp-nus",
    period: "01/2026 - 09/2026",
    location: "Singapore",
    coords: [103.82, 1.35],
    position: "Postdoctoral Fellow",
    institution: "Department of Geography, Faculty of Arts and Social Sciences, National University of Singapore",
    supervisor: "Supervised by Prof. Wei Luo",
    logo: "/logos/nus.png",
  },
  {
    id: "exp-inria",
    period: "01/2024 - 09/2024",
    location: "Paris, France",
    coords: [2.35, 48.86],
    position: "Visiting Student",
    institution: "Inria, Université Paris-Saclay",
    supervisor: "Supervised by Jean-Daniel Fekete",
    logo: "/logos/inria.png",
  },
  {
    id: "exp-msra",
    period: "07/2022 - 06/2023",
    location: "Beijing, China",
    coords: [116.41, 39.9],
    position: "Research Intern",
    institution: "Microsoft Research Asia",
    logo: "/logos/msra.png",
  },
  {
    id: "exp-zhejiang-lab",
    period: "08/2021 - 11/2021",
    location: "Hangzhou, China",
    coords: [120.15, 30.27],
    position: "Research Intern",
    institution: "Zhejiang Lab",
    logo: "/logos/zhejiang-lab.png",
  },
  {
    id: "exp-alibaba",
    period: "06/2019 - 09/2020",
    location: "Hangzhou, China",
    coords: [120.15, 30.27],
    position: "Research Intern",
    institution: "Alibaba Company",
    logo: "/logos/alibaba.png",
  },
];

export const experience: SiteConfig["experience"] = allExperience.filter(
  (item) => SHOW_UNIVERSITY_OF_VIENNA || item.id !== "exp-univie",
);

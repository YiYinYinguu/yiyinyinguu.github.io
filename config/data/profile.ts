import type { SiteConfig } from "../types";

export const site: SiteConfig["site"] = {
  name: "Lu Ying",
  title: "Hi! I am Lu Ying",
  description:
    "Lu Ying (应璐) — Postdoctoral Fellow at the National University of Singapore. Research on data visualization, human-computer interaction, and data-driven storytelling.",
  logo: "/logo.png",
};

export const profile: SiteConfig["profile"] = {
  name: "Lu Ying",
  title: "Postdoctoral Fellow",
  email: "yiyinyingl@outlook.com",
  department: "Department of Geography",
  university: "National University of Singapore",
  profileImage: "/images/profile.jpg",
  researchInterests: [
    "Data Visualization 📊",
    "Human-Computer Interaction 🖥",
    "Data-driven Storytelling 📖",
  ],
};

export const social: SiteConfig["social"] = {
  googleScholar: "https://scholar.google.ca/citations?user=QJRqoNEAAAAJ&hl=en",
  twitter: "https://twitter.com/yiyinyingl",
  linkedin: "https://www.linkedin.com/in/lu-ying-7198a01b8",
};

export const navigation: SiteConfig["navigation"] = [
  { name: "About", href: "#about" },
  { name: "Publications", href: "/publications/" },
  { name: "CV", href: "#cv" },
  { name: "Awards", href: "#awards" },
  { name: "Service", href: "#service" },
  { name: "Life", href: "/life/" },
];

export const aboutDescription: SiteConfig["aboutDescription"] = `
  I am a Postdoctoral Fellow at the [Department of Geography](https://fass.nus.edu.sg/geog/), Faculty of Arts and Social Sciences, National University of Singapore, working with [Prof. Wei Luo](https://fass.nus.edu.sg/geog/people/luo-wei/). In September 2026, I will join the University of Vienna as a postdoctoral researcher, working with [Prof. Torsten Möller](https://www.cs.univie.ac.at/torsten.moeller/).

I received my Ph.D. in Computer Science from the [State Key Lab of CAD&CG, Zhejiang University](http://www.cad.zju.edu.cn), where I was advised by [Prof. Yingcai Wu](http://ycwu.org) and was a member of [ZJUIDG](http://zjuidg.org). And I was a visiting student at [Université Paris-Saclay](https://www.universite-paris-saclay.fr/en) and a member of the [AVIZ team](https://www.aviz.fr/) at [Inria](https://www.inria.fr/en), supervised by [Jean-Daniel Fekete](http://www.aviz.fr/~fekete/).

My research lies at the intersection of human–AI interaction, visualization, and machine learning, where I design human-centered AI systems that empower people in sensemaking and decision-making. Collaborating with experts in areas like climate change and social media, I pursue interdisciplinary solutions that respond to complex and impactful real-world challenges.
  `;

export const news: SiteConfig["news"] = [
  {
    id: "news-2026-08",
    date: "08/2026",
    content: "🇦🇹 In September, I will join the University of Vienna as a postdoctoral researcher, working with [Prof. Torsten Möller](https://www.cs.univie.ac.at/torsten.moeller/). See you in Vienna!",
  },
  {
    id: "news-2026-01",
    date: "01/2026",
    content: "🇸🇬 I started my postdoc journey at the [Department of Geography](https://fass.nus.edu.sg/geog/), National University of Singapore, working with [Prof. Wei Luo](https://fass.nus.edu.sg/geog/people/luo-wei/)!",
  },
  {
    id: "news-2025-12",
    date: "12/2025",
    content: "🎓 I successfully defended my PhD on AI-Driven Generation of Infographics!",
  },
  {
    id: "news-2025-12-arxiv",
    date: "12/2025",
    content: "Our paper on [Constructive Scientific Methodology to Improve Climate Figures from IPCC](https://arxiv.org/abs/2512.15514) is available on arXiv!",
    link: "https://arxiv.org/abs/2512.15514",
  },
  {
    id: "news-2024-12",
    date: "12/2024",
    content: "Started my visiting scholar journey at [Aviz](https://www.aviz.fr/), [Inria](https://www.inria.fr/en), [Université Paris-Saclay](https://www.universite-paris-saclay.fr/en)!",
  },
  {
    id: "news-2024-10",
    date: "10/2024",
    content: "I served as a student volunteer for IEEE VIS 2024. See you in Tampa (Updated: Virtual). I'll also present our TVCG paper [Reviving Static Charts into Live Charts](https://ieeexplore.ieee.org/abstract/document/10530507/). Excited to share that I **designed the VIS 2024 SV T-shirt!** Looking forward to seeing you at VIS!",
  },
  {
    id: "news-2024-05",
    date: "05/2024",
    content: "Our paper [VAID: Indexing View Designs in Visual Analytics System](https://doi.org/10.1145/3613904.3642237) was accepted to CHI 2024! See you in Hawaii! 🌺",
  },
];

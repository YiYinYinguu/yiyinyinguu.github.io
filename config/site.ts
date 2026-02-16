// ============================================================
// 网站配置文件
// 修改这个文件来更新网站上的个人信息和链接
// ============================================================

export interface SiteConfig {
  // 网站基本信息
  site: {
    name: string;
    title: string;
    description: string;
    logo: string;
  };

  // 个人信息
  profile: {
    name: string;
    title: string;
    email: string;
    department: string;
    university: string;
    profileImage: string;
    bannerImage: string;
    researchInterests?: string[];
  };

  // 社交链接
  social: {
    googleScholar: string;
    twitter: string;
    linkedin: string;
    github?: string;
  };

  // 导航菜单
  navigation: Array<{
    name: string;
    href: string;
  }>;

  // About 页面内容
  aboutDescription: string;

  // 新闻动态
  news: Array<{
    id: string;
    date: string;
    content: string;
    link?: string;
  }>;

  // 论文列表
  publications: Array<{
    id: string;
    year: number;
    title: string;
    authors: string;
    venue: string;
    image?: string;  // 论文图片（缩略图或可视化图）
    links?: {
      pdf?: string;
      code?: string;
      data?: string;
      project?: string;
      doi?: string;
    };
  }>;

  // 教育背景
  education: Array<{
    id: string;
    period: string;
    location: string;
    degree: string;
    institution: string;
    supervisor?: string;
    logo?: string;
  }>;

  // 工作经历
  experience: Array<{
    id: string;
    period: string;
    location: string;
    position: string;
    institution: string;
    supervisor?: string;
    logo?: string;
  }>;

  // 奖项荣誉
  awards: Array<{
    id: string;
    year: string;
    title: string;
    description?: string;
  }>;

  // 服务经历
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

// ============================================================
// 配置内容 - 在这里修改你的信息
// ============================================================

export const siteConfig: SiteConfig = {
  // 网站基本信息
  site: {
    name: "Lu Ying",
    title: "Hi! I am Lu Ying",
    description: "Personal academic homepage",
    logo: "/logo.png",
  },

  // 个人信息
  profile: {
    name: "Lu Ying",
    title: "Ph.D.",
    email: "yiyinyingl@outlook.com",
    department: "Computer Science",
    university: "Zhejiang University",
    profileImage: "/profile.jpg",
    bannerImage: "/banner.png",
    researchInterests: [
      "Data Visualization 📊",
      "Human-Computer Interaction 🖥",
      "Data-driven Storytelling 👩‍🎨",
    ],
  },

  // 社交链接
  social: {
    googleScholar: "https://scholar.google.ca/citations?user=QJRqoNEAAAAJ&hl=en",
    twitter: "https://twitter.com",
    // twitter: "https://twitter.com/yiyinyingl",
    linkedin: "www.linkedin.com/in/lu-ying-7198a01b8",
  },

  // 导航菜单
  navigation: [
    { name: "About", href: "#about" },
    { name: "Publications", href: "#publications" },
    { name: "CV", href: "#cv" },
    { name: "Awards", href: "#awards" },
    { name: "Service", href: "#service" },
  ],

  // ============================================================
  // About Me 内容
  // ============================================================
  aboutDescription: `
I am a Ph.D. of computer science at the [State Key Lab of CAD&CG, Zhejiang University](http://www.cad.zju.edu.cn) and a [ZJUIDG](http://zjuidg.org) member supervised by [Prof. Yingcai Wu](http://ycwu.org). And I was a visiting student at [Université Paris-Saclay](https://www.universite-paris-saclay.fr/en) and a member of the [AVIZ team](https://www.aviz.fr/) at [Inria](https://www.inria.fr/en), supervised by [Jean-Daniel Fekete](http://www.aviz.fr/~fekete/).

My research lies at the intersection of human–AI interaction, visualization, and machine learning, where I design human-centered AI systems that empower people in sensemaking and decision-making. Collaborating with experts in areas like climate change and social media, I pursue interdisciplinary solutions that respond to complex and impactful real-world challenges.
  `,

  // ============================================================
  // 新闻动态 - 在这里添加你的最新动态
  // ============================================================
  news: [
    {
      id: "news-2025-12",
      date: "12/2025",
      content: "🎓 I successfully defend my PhD on [AI-Driven Generation of Infographics]() !",
    },
    {
      id: "news-2025-11",
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
      content: "I serve as a student volunteer for IEEE VIS 2024. See you in Tampa (Updated: Virtual). I'll also present our TVCG paper [Reviving Static Charts into Live Charts](https://ieeexplore.ieee.org/abstract/document/10530507/). Excited to share that I **designed the VIS 2024 SV T-shirt!** Looking forward to seeing you at VIS!",
    },
    {
      id: "news-2024-05",
      date: "05/2024",
      content: "Our paper [VAID: Indexing View Designs in Visual Analytics System](https://doi.org/10.1145/3613904.3642237) was accepted to CHI 2024! See you in Hawaii! 🌺",
    },
  ],

  // ============================================================
  // 论文列表 - 在这里添加你的出版物
  // ============================================================
  publications: [
    // 2024
    {
      id: "pub-2024-vaid",
      year: 2024,
      title: "VAID: Indexing View Designs in Visual Analytics System",
      authors: "**Lu Ying**, Aoyu Wu, Haotian Li, Zikun Deng, Ji Lan, Jiang Wu, Yong Wang, Huamin Qu, Dazhen Deng, Yingcai Wu",
      venue: "Proceedings of the Conference on Human Factors in Computing Systems (CHI 2024)",
      image: "/pub-2024-vaid.png",
      links: {
        pdf: "https://doi.org/10.1145/3613904.3642237",
        project: "https://vis-vaid.github.io",
      },
    },
    {
      id: "pub-2024-blowing",
      year: 2024,
      title: "Blowing Seeds across Gardens: Visualizing Implicit Propagation of Cross-Platform Social Media Posts",
      authors: "Jianing Yin, Hanze Jia, Buwei Zhou, Tan Tang, **Lu Ying**, Shuainan Ye, Tai-Quan Peng, Yingcai Wu",
      venue: "IEEE Transactions on Visualization and Computer Graphics (Proceedings of IEEE VIS 2024)",
      image: "/pub-2024-blowing.png",
      links: {
        pdf: "https://ieeexplore.ieee.org/document/10670503",
      },
    },
    {
      id: "pub-2025-repro",
      year: 2025,
      title: "Exploring the Reproducibility for Visualization Figures in Climate Change Report",
      authors: "**Lu Ying**, Yingcai Wu, Jean-Daniel Fekete",
      venue: "IEEE VIS Workshop on Visualization for Climate Action and Sustainability",
      image: "/pub-2025-repro.png",
      links: {
        pdf: "https://inria.hal.science/hal-04744236",
        code: "https://github.com/repro-ipcc",
      },
    },
    {
      id: "pub-2025-composing",
      year: 2025,
      title: "Composing Data Stories with Meta Relations",
      authors: "Haotian Li, **Lu Ying**, Leixian Shen, Yun Wang, Yingcai Wu, Huamin Qu",
      venue: "arXiv preprint arXiv:2501.03603",
      image: "/pub-2025-composing.png",
      links: {
        pdf: "https://arxiv.org/abs/2501.03603",
      },
    },
    {
      id: "pub-2025-enhancing",
      year: 2025,
      title: "Enhancing Concept Alignment with Explanatory Interactive Disentangled Representation Learning",
      authors: "Xiyu Meng, Yilong Lin, Yuhan Wu, **Lu Ying**",
      venue: "Neural Networks",
      links: {
        pdf: "https://www.sciencedirect.com/science/article/pii/S0893608025012274",
      },
      image: "/pub-2025-enhancing.png",
    },
    {
      id: "pub-2025-constructive",
      year: 2025,
      title: "A Constructive Scientific Methodology to Improve Climate Figures from IPCC",
      authors: "**Lu Ying**, Junxiu Tang, Tingying He, Jean-Daniel Fekete",
      venue: "arXiv preprint arXiv:2512.15514",
      image: "/pub-2025-ipcc.png",
      links: {
        pdf: "https://arxiv.org/abs/2512.15514",
      },
    },
    // 2023
    {
      id: "pub-2023-notable",
      year: 2023,
      title: "Notable: On-the-fly Assistant for Data Storytelling in Computational Notebooks",
      authors: "Haotian Li, **Lu Ying**, Haidong Zhang, Yingcai Wu, Huamin Qu, Yun Wang",
      venue: "Proceedings of the Conference on Human Factors in Computing Systems (CHI 2023)",
      image: "/pub-2023-notable.png",
      links: {
        pdf: "https://haotian-li.com/paper/notable.pdf",
      },
    },
    // 2022
    {
      id: "pub-2022-smartshots",
      year: 2022,
      title: "SmartShots: An Optimization Approach for Generating Videos with Data Visualizations Embedded",
      authors: "Tan Tang, Junxiu Tang, Jiewen Lai, **Lu Ying**, Peiran Ren, Lingyun Yu, Yingcai Wu",
      venue: "ACM Transactions on Intelligent Systems and Technology (TiiS)",
      image: "/pub-2022-smartshots.png",
      links: {},
    },
    // 2020
    {
      id: "pub-2020-transitions",
      year: 2020,
      title: "Narrative Transitions in Data Videos",
      authors: "Junxiu Tang, Lingyun Yu, Tan Tang, Xinhuan Shu, **Lu Ying**, Yuhua Zhou, Peiran Ren, Yingcai Wu",
      venue: "IEEE VIS 2020 Short Paper",
      links: {
        pdf: "https://arxiv.org/abs/2009.05233",
        project: "https://www.youtube.com/watch?v=RNFCuR9DgMg",
      },
      image: "/pub-2020-transitions.png",
    },
    // Journal Publications (Year varies)
    {
      id: "pub-2024-live",
      year: 2024,
      title: "Reviving Static Charts into Live Charts",
      authors: "**Lu Ying**, Yun Wang, Haotian Li, Shuguang Dou, Haidong Zhang, Xinyang Jiang, Huamin Qu, Yingcai Wu",
      venue: "IEEE Transactions on Visualization and Computer Graphics",
      image: "/pub-2024-live.png",
      links: {
        pdf: "https://ieeexplore.ieee.org/abstract/document/10530507/",
        project: "https://www.notion.so/Reviving-Static-Charts-into-Live-Chart-c7a7de117a484c67a81067af7cae910a",
      },
    },
    {
      id: "pub-2023-metaglyph",
      year: 2023,
      title: "MetaGlyph: Automatic Generation of Metaphoric Glyph-based Visualization",
      authors: "**Lu Ying**, Xinhuan Shu, Dazhen Deng, Yuchen Yang, Tan Tang, Lingyun Yu, Yingcai Wu",
      venue: "IEEE Transactions on Visualization and Computer Graphics",
      image: "/pub-2023-metaglyph.png",
      links: {
        pdf: "https://ieeexplore.ieee.org/document/9906974",
        project: "https://www.youtube.com/watch?v=E_68JwZmlcY",
      },
    },
    {
      id: "pub-2022-glyphcreator",
      year: 2022,
      title: "GlyphCreator: Towards Example-based Automatic Generation of Circular Glyphs",
      authors: "**Lu Ying**, Tan Tang, Yuzhe Luo, Lvkeshen Shen, Xiao Xie, Lingyun Yu, Yingcai Wu",
      venue: "IEEE Transactions on Visualization and Computer Graphics",
      image: "/pub-2022-glyphcreator.png",
      links: {
        pdf: "https://zjuidg.org/source/projects/glyphcreator/GlyphCreator.pdf",
        project: "https://youtu.be/uNGJtuyniyM",
      },
    },
    {
      id: "pub-2024-hierarchy",
      year: 2024,
      title: "Hierarchical Recognizing Vector Graphics and A New Chart-based Vector Graphics Dataset",
      authors: "Shuguang Dou, Xinyang Jiang, Lu Liu, **Lu Ying**, Caihua Shan, Yifei Shen, Xuanyi Dong, Yun Wang, Dongsheng Li, Cairong Zhao",
      venue: "IEEE Transactions on Pattern Analysis and Machine Intelligence",
      image: "/pub-2024-hierarchy.png",
      links: {
        pdf: "https://arxiv.org/pdf/2309.02967.pdf",
      },
    },
  ],

  // ============================================================
  // 教育背景 - 在这里添加你的教育经历
  // ============================================================
  education: [
    {
      id: "edu-phd",
      period: "09/2020 - 12/2025",
      location: "Hangzhou, China",
      degree: "Ph. D.",
      institution: "State Key Lab of CAD&CG, Zhejiang University",
      supervisor: "Supervised by Prof. Yingcai Wu",
      logo: "/zju.png",
    },
    {
      id: "edu-undergrad",
      period: "09/2016 - 06/2020",
      location: "Hangzhou, China",
      degree: "Undergraduate",
      institution: "College of Computer Science, Zhejiang University",
      supervisor: "Bachelor in Digital Media Technology",
      logo: "/zju.png",
    },
  ],

  // ============================================================
  // 工作经历 - 在这里添加你的工作经历
  // ============================================================
  experience: [
    {
      id: "exp-inria",
      period: "01/2024 - 09/2024",
      location: "Paris, France",
      position: "Visiting Student",
      institution: "Inria, Université Paris-Saclay",
      supervisor: "Supervised by Jean-Daniel Fekete",
      logo: "/inria.png",
    },
    {
      id: "exp-msra",
      period: "07/2022 - 06/2023",
      location: "Beijing, China",
      position: "Research Intern",
      institution: "Microsoft Research Asia",
      logo: "/msra.png",
    },
    {
      id: "exp-zhejiang-lab",
      period: "08/2021 - 11/2021",
      location: "Hangzhou, China",
      position: "Research Intern",
      institution: "Zhejiang Lab",
      logo: "/zhejiang-lab.png",
    },
    {
      id: "exp-alibaba",
      period: "06/2019 - 09/2020",
      location: "Hangzhou, China",
      position: "Research Intern",
      institution: "Alibaba Company",
      logo: "/alibaba.png",
    },
  ],

  // ============================================================
  // 奖项荣誉 - 在这里添加你的获奖情况
  // ============================================================
  awards: [
    {
      id: "award-2024-1",
      year: "2024",
      title: "National Scholarship",
      description: "Ministry of Education China",
    },
    {
      id: "award-2024-2",
      year: "2024",
      title: "The Third Prize of the \"Lu Zengyong CAD&CG High-Tech Award\"",
      description: "The Lu Zengyong CAD&CG Committee",
    },
    {
      id: "award-2024-3",
      year: "2024",
      title: "Inclusive Scholarship",
      description: "IEEE VIS, Tampa, USA",
    },
    {
      id: "award-2024-4",
      year: "2024",
      title: "Outstanding PhD Dissertation Funding",
      description: "Zhejiang University",
    },
    {
      id: "award-2023-1",
      year: "2023",
      title: "PhD Rising Star",
      description: "Zhejiang University",
    },
    {
      id: "award-2023-2",
      year: "2023",
      title: "Chinese Government Scholarship",
      description: "China Scholarship Council",
    },
    {
      id: "award-2023-3",
      year: "2023",
      title: "Excellence in Academic Innovation",
      description: "Zhejiang University",
    },
    {
      id: "award-2023-4",
      year: "2023",
      title: "Award of Honor for Graduate",
      description: "Zhejiang University",
    },
    {
      id: "award-2020-1",
      year: "2020",
      title: "Outstanding Graduate Award",
      description: "Zhejiang University",
    },
    {
      id: "award-2018-1",
      year: "2018",
      title: "National Scholarship",
      description: "Ministry of Education China",
    },
  ],

  // ============================================================
  // 服务经历 - 在这里添加你的学术服务经历
  // ============================================================
  service: {
    conferenceReviewing: [
      { name: "IEEE VIS", years: "2022 - 2025" },
      { name: "PacificVis", years: "2022 - 2025" },
      { name: "ChinaVis", years: "2022, 2025" },
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
  },
};

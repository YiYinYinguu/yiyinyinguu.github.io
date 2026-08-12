import type { SiteConfig } from "../types";

export const lifeCategories: SiteConfig["lifeCategories"] = [
  {
    id: "baking",
    name: "Baking",
    nameZh: "烘焙",
    unit: { zh: "次", one: "bake", many: "bakes" },
    emoji: "🧁",
    description: "Cakes, breads, and sweet experiments from my kitchen.",
    descriptionZh: "厨房里的蛋糕、面包，和各种试验。",
    cover: "/life/baking-editorial-cover.png",
  },
  {
    id: "craft",
    name: "Craft",
    nameZh: "手作",
    unit: { zh: "件", one: "piece", many: "pieces" },
    views: ["list", "timeline"],
    kindFilter: false,
    emoji: "🧶",
    description: "Rattan, crochet, felt, wood — things made by hand.",
    descriptionZh: "藤编、钩针、羊毛毡、木工，一切用手做出来的东西。",
    cover: "/life/craft-editorial-cover.png",
  },
];

export const lifeLinks: SiteConfig["lifeLinks"] = [
  {
    href: "/life/routes/",
    name: "Routes",
    nameZh: "路线",
    emoji: "🚲",
    description: "Cycling, walking, and hiking tracks, city by city.",
    descriptionZh: "骑车和走路去过的地方，一座城市一张图。",
    cover: "/life/routes-editorial-cover.png",
  },
];


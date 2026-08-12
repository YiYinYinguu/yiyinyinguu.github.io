// 内容按用途拆在 config/data/ 下；页面继续只依赖这个统一入口。
import type { SiteConfig } from "./types";
import { aboutDescription, navigation, news, profile, site, social } from "./data/profile";
import { publications } from "./data/publications";
import { education, experience } from "./data/cv";
import { awards, service } from "./data/service";
import { lifeCategories, lifeLinks } from "./data/life";

export type { SiteConfig } from "./types";

export const siteConfig: SiteConfig = {
  site,
  profile,
  social,
  navigation,
  aboutDescription,
  news,
  publications,
  education,
  experience,
  awards,
  lifeCategories,
  lifeLinks,
  service,
};

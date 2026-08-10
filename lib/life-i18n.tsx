"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { readParams, writeParam } from "./url-state";

export type Lang = "zh" | "en";

/**
 * Life 板块的中英文。站里其他部分一律英文，只有这里两种语言并存——
 * 作品本身是中文语境的，界面却要给外国同行看得懂。
 */
const DICT = {
  list: { zh: "列表", en: "List" },
  calendar: { zh: "日历", en: "Calendar" },
  timeline: { zh: "时间轴", en: "Timeline" },
  all: { zh: "全部", en: "All" },
  chinese: { zh: "中式", en: "Chinese" },
  western: { zh: "西式", en: "Western" },
  newestFirst: { zh: "最新在前 ↓", en: "Newest first ↓" },
  oldestFirst: { zh: "最早在前 ↑", en: "Oldest first ↑" },
  mostMade: { zh: "最多次做", en: "Most repeated" },
  empty: { zh: "这里还没有呢", en: "Nothing here yet" },
  collapse: { zh: "收起 ▴", en: "Collapse ▴" },
  ingredients: { zh: "用料", en: "Ingredients" },
  close: { zh: "关闭", en: "Close" },
  nextPhoto: { zh: "下一张", en: "Next photo" },
  allYears: { zh: "全部年份", en: "All years" },
  zoomHint: { zh: "双指捏合缩放，或点格子", en: "Pinch to zoom, or click a cell" },
  zoomHintDeep: {
    zh: "捏合停在某天可以直接打开那篇",
    en: "Pinch over a day to open it",
  },
  zoomOut: { zh: "缩小", en: "Zoom out" },
  zoomIn: { zh: "放大", en: "Zoom in" },
  prevMonth: { zh: "上一个月", en: "Previous month" },
  nextMonth: { zh: "下一个月", en: "Next month" },
  heatHint: {
    zh: "深浅 = 当月做了几次，点格子只看那个月",
    en: "Shade = bakes that month; click to filter",
  },
  showAll: { zh: "点这里看全部", en: "show all" },
  weekdays: { zh: "一二三四五六日", en: "MTWTFSS" },
} as const;

type Key = keyof typeof DICT;

const LangContext = createContext<Lang>("en");

export function useLang() {
  return useContext(LangContext);
}

/** t("mostMade") → 「最多次做」或 "Most repeated" */
export function useT() {
  const lang = useLang();
  return (key: Key) => DICT[key][lang];
}

/** 一次 N 的说法差别不小：中文是「7 次」，英文得分单复数。 */
export function useCount() {
  const lang = useLang();
  return (n: number) => (lang === "zh" ? `${n} 次` : `${n} ${n === 1 ? "bake" : "bakes"}`);
}

export function useMonthLabel() {
  const lang = useLang();
  const NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return (year: number, month: number) =>
    lang === "zh" ? `${year} 年 ${month} 月` : `${NAMES[month - 1]} ${year}`;
}

/** 只要月份：「2 月」/ "Feb"。不能靠从完整标签里删年份，中文会剩下「年 2 月」。 */
export function useMonthOnly() {
  const lang = useLang();
  const NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return (month: number) => (lang === "zh" ? `${month} 月` : NAMES[month - 1]);
}

/** 「歇了 3 个月」/ "3 months off" */
export function useGapLabel() {
  const lang = useLang();
  return (n: number) => (lang === "zh" ? `歇了 ${n} 个月` : `${n} month${n === 1 ? "" : "s"} off`);
}

/** 菜名：中文模式用 title，英文模式用 title_en，没写英文名就退回中文。 */
export function useTitle() {
  const lang = useLang();
  return (post: { title: string; titleEn?: string }) =>
    lang === "en" ? post.titleEn || post.title : post.title;
}

export function LangProvider({
  children,
}: {
  children: (lang: Lang, setLang: (l: Lang) => void) => React.ReactNode;
}) {
  // 静态导出的 HTML 是英文的，所以先渲染英文再按偏好切换，避免水合不一致
  const [lang, setLang] = useState<Lang>("en");

  // 地址栏里写死的优先——那是别人发过来的链接，应该按发的人看到的样子打开
  const ready = useRef(false);
  useEffect(() => {
    const fromUrl = readParams().get("lang");
    const saved = localStorage.getItem("life-lang");
    if (fromUrl === "zh" || fromUrl === "en") setLang(fromUrl);
    else if (saved === "zh" || saved === "en") setLang(saved);
    else if (navigator.language.toLowerCase().startsWith("zh")) setLang("zh");
    ready.current = true;
  }, []);

  useEffect(() => {
    if (ready.current) writeParam("lang", lang === "en" ? null : lang);
  }, [lang]);

  const choose = (l: Lang) => {
    setLang(l);
    localStorage.setItem("life-lang", l);
  };

  return <LangContext.Provider value={lang}>{children(lang, choose)}</LangContext.Provider>;
}

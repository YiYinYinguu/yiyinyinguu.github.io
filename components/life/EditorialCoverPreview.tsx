"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LangProvider, type Lang } from "@/lib/life-i18n";

export type EditorialCoverEntry = {
  slug: string;
  title: string;
  titleEn?: string;
  date: string;
  kind?: string;
  note?: string;
  hasRecipe: boolean;
  image: string;
};

type LayoutId = "compact" | "portrait" | "poster";
type Dir = "new" | "old";

const INK = ["#7a5fa0", "#9a6b3f", "#5f8055", "#a85a70", "#4f7a99", "#b5793a"];
const TILT = [-1.1, 1.2, -0.7, 1, -1.4, 0.8];

const LAYOUTS: Array<{
  id: LayoutId;
  zh: string;
  en: string;
  zhNote: string;
  enNote: string;
}> = [
  {
    id: "compact",
    zh: "A · 紧凑插页",
    en: "A · Compact insert",
    zhNote: "最接近现在的密度，封面缩小后完整放入。",
    enNote: "Closest to the current density; the full cover is reduced to fit.",
  },
  {
    id: "portrait",
    zh: "B · 竖版拍立得",
    en: "B · Portrait Polaroid",
    zhNote: "保留现在的左右结构，让竖图成为主角。",
    enNote: "Keeps the current side-by-side structure and gives the cover more presence.",
  },
  {
    id: "poster",
    zh: "C · 整页海报",
    en: "C · Full-page poster",
    zhNote: "封面最大，便签移到下方，像贴进手账的一张海报。",
    enNote: "Largest cover, with the note below like a poster pasted into the journal.",
  },
];

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`journal-hand rounded-full border px-3.5 py-1 text-base transition-colors ${
        active
          ? "border-[#9a6b3f] bg-[#9a6b3f] text-white"
          : "border-[#ded3b6] bg-white/60 text-[#7d6a4a] hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function Note({
  entry,
  ink,
  lang,
  minHeight,
}: {
  entry: EditorialCoverEntry;
  ink: string;
  lang: Lang;
  minHeight?: string;
}) {
  const title = lang === "en" ? entry.titleEn || entry.title : entry.title;

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col rounded-[3px] border border-[#e0d3a8] px-3.5 py-3.5 ${
        minHeight || ""
      }`}
    >
      <div>
        <span
          className={`journal-hand inline rounded-[3px] px-2.5 py-[2px] leading-[1.75] text-white box-decoration-clone ${
            lang === "zh" ? "text-xl sm:text-[23px]" : "text-lg sm:text-[19px]"
          }`}
          style={{ background: `color-mix(in srgb, ${ink} 40%, transparent)` }}
        >
          #{title}
        </span>
      </div>
      {entry.note && (
        <p className="journal-hand mt-2.5 text-[15px] leading-[1.95] sm:text-lg" style={{ color: ink }}>
          {entry.note.split("|").map((line, index) => (
            <span key={index} className="block">
              {line.trim()}
            </span>
          ))}
        </p>
      )}
      <span
        className="journal-hand mt-auto self-end pt-3 text-sm opacity-70 sm:text-base"
        style={{ color: ink }}
      >
        {entry.hasRecipe && <span className="mr-1.5">✎</span>}
        {entry.date.replace(/-/g, ".")}
      </span>
    </div>
  );
}

function Polaroid({
  entry,
  tilt,
  mode,
  eager,
  children,
}: {
  entry: EditorialCoverEntry;
  tilt: number;
  mode: LayoutId;
  eager: boolean;
  children?: React.ReactNode;
}) {
  const shell =
    mode === "compact"
      ? "w-[124px] p-2 pb-6"
      : mode === "portrait"
        ? "w-[178px] p-[10px] pb-8"
        : "w-full max-w-[276px] p-3 pb-3";

  return (
    <div
      className={`mx-auto flex-shrink-0 rounded-[2px] bg-white shadow-[0_3px_10px_rgba(90,70,40,0.22)] transition-transform duration-300 group-hover:scale-[1.03] group-hover:rotate-0 ${shell}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <Image
        src={entry.image}
        alt={`${entry.title} editorial cover`}
        width={1024}
        height={1536}
        priority={eager}
        sizes={mode === "compact" ? "108px" : mode === "portrait" ? "158px" : "276px"}
        className="block aspect-[2/3] w-full bg-gray-100 object-contain"
      />
      {children}
    </div>
  );
}

function PolaroidFooter({
  entry,
  ink,
  lang,
}: {
  entry: EditorialCoverEntry;
  ink: string;
  lang: Lang;
}) {
  const title = lang === "en" ? entry.titleEn || entry.title : entry.title;

  return (
    <div className="flex min-h-[72px] flex-col px-1 pb-1 pt-3 text-left">
      <div>
        <span
          className={`journal-hand inline rounded-[3px] px-2 py-[1px] leading-[1.65] text-white box-decoration-clone ${
            lang === "zh" ? "text-lg" : "text-[17px]"
          }`}
          style={{ background: `color-mix(in srgb, ${ink} 40%, transparent)` }}
        >
          #{title}
        </span>
      </div>
      <span
        className="journal-hand mt-auto self-end pt-1.5 text-xs opacity-70"
        style={{ color: ink }}
      >
        {entry.hasRecipe && <span className="mr-1.5">✎</span>}
        {entry.date.replace(/-/g, ".")}
      </span>
    </div>
  );
}

function JournalCards({
  entries,
  layout,
  lang,
}: {
  entries: EditorialCoverEntry[];
  layout: LayoutId;
  lang: Lang;
}) {
  const grid =
    layout === "poster"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-7 gap-y-10"
      : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6";

  return (
    <div className={`grid items-start ${grid}`}>
      {entries.map((entry, index) => {
        const ink = INK[index % INK.length];
        const tilt = TILT[index % TILT.length];

        if (layout === "poster") {
          return (
            <Link
              key={entry.slug}
              href={`/life/baking/${entry.slug}/`}
              className="group block min-w-0"
            >
              <Polaroid entry={entry} tilt={tilt} mode={layout} eager={index < 4}>
                <PolaroidFooter entry={entry} ink={ink} lang={lang} />
              </Polaroid>
            </Link>
          );
        }

        return (
          <Link
            key={entry.slug}
            href={`/life/baking/${entry.slug}/`}
            className="group flex flex-col items-start gap-4 min-[390px]:flex-row"
          >
            <Polaroid entry={entry} tilt={tilt} mode={layout} eager={index < 3} />
            <Note
              entry={entry}
              ink={ink}
              lang={lang}
              minHeight={layout === "compact" ? "min-h-[186px]" : "min-h-[279px]"}
            />
          </Link>
        );
      })}
    </div>
  );
}

function PreviewBody({ entries, lang }: { entries: EditorialCoverEntry[]; lang: Lang }) {
  const [layout, setLayout] = useState<LayoutId>("portrait");
  const [kind, setKind] = useState("");
  const [dir, setDir] = useState<Dir>("new");

  const shown = useMemo(() => {
    const filtered = kind ? entries.filter((entry) => entry.kind === kind) : entries;
    return dir === "new" ? filtered : [...filtered].reverse();
  }, [entries, kind, dir]);

  const active = LAYOUTS.find((item) => item.id === layout) || LAYOUTS[1];
  const zh = lang === "zh";

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {LAYOUTS.map((item) => (
          <Pill key={item.id} active={layout === item.id} onClick={() => setLayout(item.id)}>
            {zh ? item.zh : item.en}
          </Pill>
        ))}
      </div>

      <p className="journal-hand mb-5 text-base text-[#8a7355]">
        {zh ? active.zhNote : active.enNote}
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pill active={!kind} onClick={() => setKind("")}>
          {zh ? "全部" : "All"}
        </Pill>
        <Pill active={kind === "中式"} onClick={() => setKind("中式")}>
          {zh ? "中式" : "Chinese"}
        </Pill>
        <Pill active={kind === "西式"} onClick={() => setKind("西式")}>
          {zh ? "西式" : "Western"}
        </Pill>
        <div className="ml-auto">
          <Pill active onClick={() => setDir(dir === "new" ? "old" : "new")}>
            {dir === "new" ? (zh ? "最新在前 ↓" : "Newest first ↓") : zh ? "最早在前 ↑" : "Oldest first ↑"}
          </Pill>
        </div>
      </div>

      <div className="journal-paper rounded-lg p-5 sm:p-7">
        <JournalCards entries={shown} layout={layout} lang={lang} />
      </div>
    </>
  );
}

export default function EditorialCoverPreview({ entries }: { entries: EditorialCoverEntry[] }) {
  return (
    <LangProvider unit={{ zh: "次", one: "bake", many: "bakes" }}>
      {(lang, setLang) => {
        const zh = lang === "zh";
        return (
          <main className="px-4 py-8 sm:py-10">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-900">
                    <Link href="/life/" className="text-gray-400 transition-colors hover:text-primary">
                      {zh ? "生活" : "Life"}
                    </Link>
                    <span className="font-normal text-gray-300">/</span>
                    <Link href="/life/baking/" className="text-gray-400 transition-colors hover:text-primary">
                      🧁 {zh ? "烘焙" : "Baking"}
                    </Link>
                    <span className="font-normal text-gray-300">/</span>
                    <span>{zh ? "封面方案" : "Cover study"}</span>
                  </h1>
                  <p className="text-base text-gray-600">
                    {zh
                      ? "保留原来的手账，只比较竖版封面在卡片里的三种放法。"
                      : "The same journal, comparing three ways to place the new portrait covers."}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {entries.length} {zh ? "次烘焙" : "bakes"} · 2020.02 — 2026.02
                  </p>
                </div>

                <div className="flex-shrink-0 text-sm sm:pt-1">
                  {(["en", "zh"] as Lang[]).map((item, index) => (
                    <span key={item}>
                      {index > 0 && <span className="mx-2 text-gray-300">/</span>}
                      <button
                        type="button"
                        onClick={() => setLang(item)}
                        aria-pressed={lang === item}
                        className={
                          lang === item
                            ? "text-gray-900"
                            : "text-gray-400 transition-colors hover:text-primary"
                        }
                      >
                        {item === "en" ? "EN" : "中文"}
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <PreviewBody entries={entries} lang={lang} />
              </div>
            </div>
          </main>
        );
      }}
    </LangProvider>
  );
}

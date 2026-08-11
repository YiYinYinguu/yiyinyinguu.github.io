"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import ExperienceGlobe, { cityOf } from "./ExperienceGlobe";

export default function EducationExperience() {
  const { education, experience } = siteConfig;
  // 地球垫在条目底下，悬停时两边一起亮，再从那一行拉一条虚线连到点上
  const [hover, setHover] = useState<string | null>(null);
  // 滚到哪一条，球就转到那座城
  const [inView, setInView] = useState<string | null>(null);
  const [lead, setLead] = useState("");
  const wrap = useRef<HTMLDivElement>(null);
  const rows = useRef(new Map<string, HTMLDivElement>());
  const hovered = useRef<HTMLElement | null>(null);

  // 悬停优先于滚动：手放上去了就是在问这一条，不管页面滚到哪儿
  const city = hover ?? inView;

  // 哪一条经历正处在视窗中间那条带子里，就算是「在读」的那条。
  // 用 IntersectionObserver 而不是监听 scroll：滚动回调每帧都要自己算位置，
  // 而这里只在越过那条线时响一下。
  useEffect(() => {
    const seen = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set((e.target as HTMLElement).dataset.row!, e.isIntersecting));
        // 带子里可能同时有两条（行比带子矮），取列表里靠前的那条，
        // 否则往回滚的时候会在两座城之间反复横跳
        const first = experience.find((exp) => seen.get(exp.id));
        if (first) setInView(cityOf(first.location));
      },
      // 上下各切掉 45%，只剩视窗正中一条带子
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    rows.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [experience]);

  /** 从行的右侧（logo 左边）拉一条曲线到底图上那个点。 */
  function connect(target: HTMLElement | null, name: string | null) {
    hovered.current = name ? target : null;
    setHover(name);
    if (!target || !name) setLead("");
  }

  // 球是转着的，点每帧都在挪，所以连线也得每帧重算。
  // 悬停时才跑这个循环——没人悬停的时候没有线要画。
  useEffect(() => {
    if (!hover) return;
    let raf = 0;
    const tick = () => {
      const target = hovered.current;
      const pin = wrap.current?.querySelector(`[data-pin="${hover}"]`);
      const dot = pin?.getBoundingClientRect();
      // 转到背面的点是 display:none，量出来是个零尺寸的框，连过去会指到左上角
      if (!target || !dot || !dot.width) {
        setLead("");
      } else {
        const box = wrap.current!.getBoundingClientRect();
        const row = target.getBoundingClientRect();
        // 从 logo 左边起笔，不是从行的右端：logo 宽 100，加上行的 px-3，
        // 退到 120 就贴着标志的左边缘，既不压上去也不空出一截
        const x1 = row.right - box.left - 120;
        const y1 = row.top + row.height / 2 - box.top;
        // 停在红点的右边缘外一点，不拉到点心：线压过去的话点就不是一个完整的圆了
        const x2 = dot.right + 3 - box.left;
        const y2 = dot.top + dot.height / 2 - box.top;
        const mid = (x1 + x2) / 2;
        setLead(`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hover]);

  return (
    <div className="space-y-12">
      {/* Education Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>🎓</span>
          <span>Education</span>
        </h2>
        <div className="space-y-6">
          {education.map((edu) => (
            <div key={edu.id} className="pb-6 border-b border-gray-200">
              <div className="flex gap-4 items-center">
                {/* Period & Location (Left) */}
                <div className="flex-shrink-0 w-36 text-sm text-gray-500 space-y-1">
                  <div>{edu.period}</div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {edu.location}
                  </div>
                </div>

                {/* Content (Center) */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {edu.degree}
                  </h3>
                  <p className="text-base text-gray-800 mb-1">
                    {edu.institution}
                  </p>
                  {edu.supervisor && (
                    <p className="text-sm text-gray-600 mb-2">
                      {edu.supervisor}
                    </p>
                  )}
                </div>

                {/* Logo (Right) */}
                {edu.logo && (
                  <Image
                    src={edu.logo}
                    alt={edu.institution}
                    width={150}
                    height={150}
                    className="flex-shrink-0 object-contain"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Experience Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>🖥</span>
          <span>Experience</span>
        </h2>

        <div ref={wrap} className="relative" onMouseLeave={() => connect(null, null)}>
          <ExperienceGlobe items={experience} active={city} />

          {/* 引导线画在条目上面，但不接收鼠标，否则会打断悬停 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            <path
              d={lead}
              fill="none"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              className={`stroke-primary transition-opacity ${lead ? "opacity-70" : "opacity-0"}`}
            />
          </svg>

        <div className="relative z-10 space-y-6">
          {experience.map((exp) => {
            const here = cityOf(exp.location);
            const on = city === here;
            return (
            <div
              key={exp.id}
              data-row={exp.id}
              ref={(el) => {
                if (el) rows.current.set(exp.id, el);
                else rows.current.delete(exp.id);
              }}
              onMouseEnter={(e) => connect(e.currentTarget, here)}
              className={`pb-6 border-b border-gray-200 -mx-3 px-3 rounded-md transition-colors ${
                on ? "bg-[rgba(250,247,244,0.2)]" : ""
              }`}
            >
              <div className="flex gap-4 items-center">
                {/* Period & Location (Left) */}
                <div
                  className={`flex-shrink-0 w-36 text-sm space-y-1 transition-colors ${
                    on ? "text-primary" : "text-gray-500"
                  }`}
                >
                  <div>{exp.period}</div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {exp.location}
                  </div>
                </div>

                {/* Content (Center) */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-lg font-semibold mb-1 transition-colors ${
                      on ? "text-primary" : "text-gray-900"
                    }`}
                  >
                    {exp.position}
                  </h3>
                  <p className="text-base text-gray-800 mb-1">
                    {exp.institution}
                  </p>
                  {exp.supervisor && (
                    <p className="text-sm text-gray-600 mb-2">
                      {exp.supervisor}
                    </p>
                  )}
                </div>

                {/* Logo (Right) */}
                {exp.logo && (
                  <Image
                    src={exp.logo}
                    alt={exp.institution}
                    width={100}
                    height={100}
                    className="flex-shrink-0 object-contain"
                  />
                )}
              </div>
            </div>
            );
          })}
        </div>
        </div>
      </section>
    </div>
  );
}

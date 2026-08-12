import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import { siteConfig } from "@/config/site";
import { getPostsByCategory } from "@/lib/life";
import { getPlacesSummary } from "@/lib/routes";

export const metadata = {
  title: "Life - Lu Ying",
  description: "Baking, handicraft, and other things I make outside research.",
};

// 每张封面斜一点，跟板块页里的拍立得一个脾气。
// 三个角度而不是两个：一行三张的时候，两个值会让首尾歪成一样的，像模板
const TILT = [-1.2, 1.1, -0.5];

export default function LifePage() {
  const { lifeCategories, lifeLinks } = siteConfig;
  // 跟 Routes 页里的统计口径一致：那一页早就不只是骑行轨迹了
  const routes = getPlacesSummary();
  const routesMeta = `${routes.regions} countries · ${routes.places} places`;

  // markdown 板块和 Routes 这类构建时生成的板块，在这一层是一样的卡片，
  // 差别只在「几篇」怎么数——所以在这里就统一成 meta 一行字，下面不再分叉。
  const cards = [
    ...lifeCategories.map((cat) => {
      const count = getPostsByCategory(cat.id).length;
      return {
        href: `/life/${cat.id}/`,
        name: cat.name,
        emoji: cat.emoji,
        description: cat.description,
        cover: cat.cover,
        meta: `${count} ${count === 1 ? "post" : "posts"}`,
      };
    }),
    ...lifeLinks.map((link) => ({
      href: link.href,
      name: link.name,
      emoji: link.emoji,
      description: link.description,
      cover: link.cover,
      // 目前只有 Routes 一项，它数的是路线不是文章。再加别的板块时，
      // 与其在这里堆 if，不如给 lifeLinks 加一个自己算 meta 的字段。
      meta: link.href === "/life/routes/" ? routesMeta : "",
    })),
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="px-4 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>🌿</span>
          <span>Life</span>
        </h1>
        <p className="text-gray-600">Things I make and love outside research.</p>

        <div className="journal-paper rounded-lg p-4 sm:p-7 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 items-stretch">
              {cards.map((card, i) => (
                  <Link key={card.href} href={card.href} className="group block h-full">
                    <div
                      // h-full + 外层 items-stretch：三张相纸一样高。
                      // 不然描述文字换不换行会让每张矮一截，一行摆三张时很显眼
                      className="flex h-full flex-col bg-white rounded-[2px] p-[10px] pb-3 shadow-[0_3px_10px_rgba(90,70,40,0.22)] transition-transform duration-300 group-hover:scale-[1.02] group-hover:rotate-0"
                      style={{ transform: `rotate(${TILT[i % TILT.length]}deg)` }}
                    >
                      <div className="relative aspect-square">
                        {card.cover ? (
                          <Image
                            src={card.cover}
                            alt={card.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover bg-gray-100"
                          />
                        ) : (
                          // 还没配封面图的板块，先用相纸的底色占着位置，
                          // 至少版面是齐的，不会因为缺一张图塌一块
                          <div className="absolute inset-0 flex items-center justify-center bg-[#f7f5f2] text-5xl opacity-40">
                            {card.emoji}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col pt-3 px-1">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {card.emoji} {card.name}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {card.description}
                        </p>
                        {/* mt-auto：不管描述是一行还是两行，这一行都贴着卡片底边，
                            三张卡的「107 posts」「142 routes」才会齐平 */}
                        <p className="text-xs text-gray-400 mt-auto pt-2">{card.meta}</p>
                      </div>
                    </div>
                  </Link>
              ))}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

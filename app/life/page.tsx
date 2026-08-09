import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import { siteConfig } from "@/config/site";
import { getPostsByCategory } from "@/lib/life";

export const metadata = {
  title: "Life - Lu Ying",
  description: "Baking, knitting, and other things I make outside research.",
};

// 每张封面斜一点，跟板块页里的拍立得一个脾气
const TILT = [-1.2, 1.1];

export default function LifePage() {
  const { lifeCategories } = siteConfig;
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>🌿</span>
          <span>Life</span>
        </h1>
        <p className="text-gray-600">Things I make and love outside research.</p>

        <div className="journal-paper rounded-lg p-5 sm:p-7 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
              {lifeCategories.map((cat, i) => {
                const count = getPostsByCategory(cat.id).length;
                return (
                  <Link key={cat.id} href={`/life/${cat.id}`} className="group block">
                    <div
                      className="bg-white rounded-[2px] p-[10px] pb-3 shadow-[0_3px_10px_rgba(90,70,40,0.22)] transition-transform duration-300 group-hover:scale-[1.02] group-hover:rotate-0"
                      style={{ transform: `rotate(${TILT[i % TILT.length]}deg)` }}
                    >
                      <div className="relative h-48">
                        <Image
                          src={cat.cover}
                          alt={cat.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover bg-gray-100"
                        />
                      </div>
                      <div className="pt-3 px-1">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {cat.emoji} {cat.name}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {cat.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {count} {count === 1 ? "post" : "posts"}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </main>
    </div>
  );
}

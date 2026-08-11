import Header from "@/components/layout/Header";
import RoutesExplorer from "@/components/routes/RoutesExplorer";
import { getRouteCities } from "@/lib/routes";

export const metadata = {
  title: "Routes - Lu Ying",
  description: "Cycling, walking, and hiking tracks from an Apple Watch, city by city.",
};

/**
 * 世界 → 城市 → 单条路线，三层都在这一个页面里切换。
 *
 * 城市清单和缩略图在构建时读好；各城的坐标点另外放在 public/routes/ 下，
 * 点进城市才取——一级页只是一张世界地图，不该为它先下 150KB 轨迹。
 */
export default function RoutesPage() {
  const cities = getRouteCities();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          {cities.length === 0 ? (
            // 数据是 scripts/build-routes.py 生成的，没跑过脚本就什么都没有
            <p className="text-gray-500">
              还没有轨迹数据。跑一次 <code>python3 scripts/build-routes.py &lt;导出的 html&gt;</code>。
            </p>
          ) : (
            <RoutesExplorer cities={cities} />
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("about");
  const [scrollProgress, setScrollProgress] = useState(0);
  const { site, navigation } = siteConfig;
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  // 滚动监听，高亮当前可见的 section + 更新滚动进度
  useEffect(() => {
    const handleScroll = () => {
      if (!isHome) return;
      const sections = navigation
        .filter((item) => item.href.startsWith("#"))
        .map((item) => item.href.replace("#", ""));
      const scrollPosition = window.scrollY + 100; // 偏移量，用于提前高亮

      // 更新 active section
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section);
            break;
          }
        }
      }

      // 计算滚动进度
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = (window.scrollY / documentHeight) * 100;
      setScrollProgress(Math.min(scrolled, 100));
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // 初始化时检查一次

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [navigation, isHome]);

  // 点击锚点导航项：主页内平滑滚动，其他页面跳回主页对应位置
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => {
    e.preventDefault();

    if (!isHome) {
      router.push(`/${href}`);
      setMobileMenuOpen(false);
      return;
    }

    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);

    if (element) {
      const offsetTop = element.offsetTop - 80; // 减去 header 高度
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
      setMobileMenuOpen(false); // 关闭移动端菜单
    }
  };

  return (
    <header className="bg-gray-100/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      {/* Colored bar with scroll progress */}
      <div className="h-2 w-full bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 transition-all duration-150 ease-out"
          style={{
            width: scrollProgress === 0 ? "100%" : `${scrollProgress}%`,
            opacity: scrollProgress === 0 ? 0.5 : 1
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-8 h-16 px-6 md:px-12 xl:px-40 2xl:px-60">
        {/* Site Title */}
        <div className="flex-shrink-0">
          <button
            onClick={(e) => handleClick(e, "#about")}
            className="flex items-center gap-2 text-2xl font-extrabold text-gray-900 hover:text-primary transition-colors"
            style={{ cursor: 'pointer' }}
          >
            <Image src={site.logo} alt="" width={34} height={34} />
            {site.name}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 lg:gap-8 xl:gap-10">
          {navigation.map((item) => {
            const isPageLink = item.href.startsWith("/");
            const isActive = isPageLink
              ? pathname.startsWith(item.href)
              : isHome && activeSection === item.href.replace("#", "");
            const cls = `text-base transition-colors ${
              isActive
                ? "text-primary font-bold"
                : "text-gray-700 hover:text-primary font-medium"
            }`;
            return isPageLink ? (
              <Link key={item.name} href={item.href} className={cls}>
                {item.name}
              </Link>
            ) : (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleClick(e, item.href)}
                className={cls}
                style={{ cursor: 'pointer' }}
              >
                {item.name}
              </a>
            );
          })}
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-700 hover:text-primary focus:outline-none"
            style={{ cursor: 'pointer' }}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 pl-4 space-y-2">
          {navigation.map((item) => {
            const isPageLink = item.href.startsWith("/");
            const isActive = isPageLink
              ? pathname.startsWith(item.href)
              : isHome && activeSection === item.href.replace("#", "");
            const cls = `block text-sm py-2 transition-colors ${
              isActive
                ? "text-primary font-extrabold"
                : "text-gray-700 hover:text-primary font-medium"
            }`;
            return isPageLink ? (
              <Link
                key={item.name}
                href={item.href}
                className={cls}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ) : (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleClick(e, item.href)}
                className={cls}
                style={{ cursor: 'pointer' }}
              >
                {item.name}
              </a>
            );
          })}
        </div>
      )}
    </header>
  );
}

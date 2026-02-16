import ReactMarkdown from "react-markdown";
import { siteConfig } from "@/config/site";
import NewsSection from "./NewsSection";

export default function AboutSection() {
  const { aboutDescription } = siteConfig;

  return (
    <div>
      {/* Title */}
      <div className="mb-6 flex items-baseline gap-2">
        <h2 className="text-4xl font-alegreya font-semibold text-gray-900">
          👋🏻 Hi, I am Lu Ying
        </h2>
        <span className="font-pingfang text-gray-500 text-lg">
          (应璐)
        </span>
      </div>

      {/* Description - 使用 Markdown 渲染以支持链接 */}
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          components={{
            a: ({ node, ...props }) => (
              <a {...props} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" />
            ),
            p: ({ node, ...props }) => (
              <p {...props} className="leading-relaxed text-gray-500 mb-4"/>
            ),
          }}
        >
          {aboutDescription}
        </ReactMarkdown>
      </div>

      <NewsSection />
    </div>
  );
}

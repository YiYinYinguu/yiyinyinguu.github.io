import ReactMarkdown from "react-markdown";
import { siteConfig } from "@/config/site";

export default function NewsSection() {
  const { news } = siteConfig;

  if (news.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">📰 News</h2>
      <div className="space-y-3">
        {news.map((item) => (
          <div key={item.id} className="flex flex-col gap-1 sm:flex-row sm:gap-4 sm:items-start">
            <div className="flex-shrink-0 text-xs text-gray-500 sm:w-20 sm:text-right sm:pt-0.5">
              {item.date}
            </div>
            <div className="flex-1 prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <a {...props} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" />
                  ),
                  p: ({ node, ...props }) => (
                    <p {...props} className="text-s text-gray-800 leading-relaxed"/>
                  ),
                }}
              >
                {item.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

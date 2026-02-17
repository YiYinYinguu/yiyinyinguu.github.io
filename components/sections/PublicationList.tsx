"use client";

import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { useState } from "react";

// Helper function to convert markdown bold syntax to HTML
function parseMarkdownBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export default function PublicationList() {
  const { publications } = siteConfig;

  // State to track which years are expanded (all expanded by default)
  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    () => new Set(Object.keys(publications.reduce((acc, pub) => {
      if (!acc[pub.year]) {
        acc[pub.year] = [];
      }
      acc[pub.year].push(pub);
      return acc;
    }, {} as Record<number, typeof publications>)).map(Number))
  );

  // Toggle function for year expansion
  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  // Group publications by year
  const groupedPubs = publications.reduce((acc, pub) => {
    if (!acc[pub.year]) {
      acc[pub.year] = [];
    }
    acc[pub.year].push(pub);
    return acc;
  }, {} as Record<number, typeof publications>);

  // Sort years in descending order
  const sortedYears = Object.keys(groupedPubs)
    .map(Number)
    .sort((a, b) => b - a);

  if (publications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No publications yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedYears.map((year) => (
        <div key={year} className="space-y-6">
          {/* Clickable year header */}
          <button
            onClick={() => toggleYear(year)}
            className="w-full text-left group cursor-pointer"
          >
            <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2 flex items-center justify-between hover:text-primary transition-colors" style={{ cursor: 'pointer' }}>
              <span>{year}</span>
              <svg
                className={`w-6 h-6 transform transition-transform duration-200 flex-shrink-0 ${
                  expandedYears.has(year) ? 'rotate-180' : 'rotate-0'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </h2>
          </button>

          {/* Expandable publications list */}
          <div
            className={`space-y-6 overflow-hidden transition-all duration-200 ${
              expandedYears.has(year) ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {groupedPubs[year].map((pub) => (
              <div key={pub.id} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                {/* Publication Image */}
                {pub.image && (
                  <div className="flex-shrink-0 self-center h-40 w-auto bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden" style={{ maxWidth: '320px' }}>
                    <Image
                      src={pub.image}
                      alt={pub.title}
                      width={320}
                      height={160}
                      sizes="(max-width: 768px) 100vw, 320px"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Publication Info */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h3 className="text-base font-semibold text-gray-900 leading-snug mb-2">
                    {pub.title}
                  </h3>

                  {/* Authors */}
                  <p
                    className="text-sm text-gray-600 mb-1 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownBold(pub.authors) }}
                  />

                  {/* Venue */}
                  <p className="text-sm text-gray-500 italic mb-3">
                    {pub.venue}
                  </p>

                  {/* Links */}
                  {pub.links && Object.keys(pub.links).length > 0 && (
                    <div className="flex flex-wrap gap-2 text-sm">
                      {pub.links.pdf && (
                        <Link
                          href={pub.links.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                          style={{ cursor: 'pointer' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          PDF
                        </Link>
                      )}
                      {pub.links.code && (
                        <Link
                          href={pub.links.code}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                          style={{ cursor: 'pointer' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          Code
                        </Link>
                      )}
                      {pub.links.data && (
                        <Link
                          href={pub.links.data}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                          style={{ cursor: 'pointer' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                          </svg>
                          Data
                        </Link>
                      )}
                      {pub.links.project && (
                        <Link
                          href={pub.links.project}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                          style={{ cursor: 'pointer' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Project
                        </Link>
                      )}
                      {pub.links.doi && (
                        <Link
                          href={pub.links.doi}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                          style={{ cursor: 'pointer' }}
                        >
                          DOI
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

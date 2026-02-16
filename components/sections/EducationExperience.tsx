import Image from "next/image";
import { siteConfig } from "@/config/site";

export default function EducationExperience() {
  const { education, experience } = siteConfig;

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
        <div className="space-y-6">
          {experience.map((exp) => (
            <div key={exp.id} className="pb-6 border-b border-gray-200">
              <div className="flex gap-4 items-center">
                {/* Period & Location (Left) */}
                <div className="flex-shrink-0 w-36 text-sm text-gray-500 space-y-1">
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
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
          ))}
        </div>
      </section>
    </div>
  );
}

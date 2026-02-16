import { siteConfig } from "@/config/site";

export default function ServiceSection() {
  const { service } = siteConfig;

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>🤝</span>
        <span>Service</span>
      </h2>

      {/* Conference Reviewing */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3">Conference Reviewing</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
          {service.conferenceReviewing.map((item, index) => (
            <span key={index}>
              {item.name} <span className="text-gray-400">{item.years}</span>
              {index < service.conferenceReviewing.length - 1 && <span className="text-gray-300 mx-1">•</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Journal Reviewing */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3">Journal Reviewing</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
          {service.journalReviewing.map((item, index) => (
            <span key={index}>
              {item.name} <span className="text-gray-400">{item.years}</span>
              {index < service.journalReviewing.length - 1 && <span className="text-gray-300 mx-1">•</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Community Service */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">Community Service</h3>
        <div className="space-y-3">
          {service.communityService.map((item) => (
            <div key={item.id} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-24 text-sm text-gray-500">
                {item.period}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900">
                  {item.role}
                  {item.organization && (
                    <span className="text-sm text-gray-600 ml-2">
                      {item.organization}
                      {item.description && <span className="ml-1">({item.description})</span>}
                    </span>
                  )}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

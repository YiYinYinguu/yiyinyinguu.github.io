import { siteConfig } from "@/config/site";

export default function AwardsSection() {
  const { awards } = siteConfig;

  if (awards.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>🏆</span>
        <span>Awards</span>
      </h2>
      <div className="space-y-3">
        {awards.map((award) => (
          <div key={award.id} className="flex gap-4 items-center">
            <div className="flex-shrink-0 w-20 text-s font-semibold text-primary">
              {award.year}
            </div>
            <div className="flex-1">
              <h3 className="text-s font-semibold text-gray-900">
                {award.title}
                {award.description && (
                  <span className="text-sm text-gray-600 ml-2">
                    , {award.description}
                  </span>
                )}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

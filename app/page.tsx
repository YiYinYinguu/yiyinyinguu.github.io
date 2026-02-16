import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import AboutSection from "@/components/sections/AboutSection";
import PublicationList from "@/components/sections/PublicationList";
import EducationExperience from "@/components/sections/EducationExperience";
import AwardsSection from "@/components/sections/AwardsSection";
import ServiceSection from "@/components/sections/ServiceSection";

export default function Home() {

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto flex gap-8 relative">
          {/* Sidebar */}
          <aside className="w-full md:w-1/5 flex-shrink-0 hidden md:block">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </aside>

          {/* Content Area */}
          <div className="w-full md:w-4/5 space-y-8">
            {/* About Section */}
            <section id="about" className="scroll-mt-20">
              <AboutSection />
            </section>

            {/* Publications Section */}
            <section id="publications" className="scroll-mt-20">
              <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <span>📑</span>
                <span>Publications</span>
              </h1>
              <PublicationList />
            </section>

            {/* CV Section */}
            <section id="cv" className="scroll-mt-20">
              <h1 className="text-2xl font-bold text-gray-900 mb-8">Curriculum Vitae</h1>
              <EducationExperience />
            </section>

            {/* Awards Section */}
            <section id="awards" className="scroll-mt-20">
              <AwardsSection />
            </section>

            {/* Service Section */}
            <section id="service" className="scroll-mt-20">
              <ServiceSection />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

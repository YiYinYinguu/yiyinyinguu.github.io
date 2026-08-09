import Header from "@/components/layout/Header";
import PublicationList from "@/components/sections/PublicationList";

export const metadata = {
  title: "Publications - Lu Ying",
  description: "Full list of publications by Lu Ying.",
};

export default function PublicationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <span>📑</span>
          <span>Publications</span>
        </h1>
        <PublicationList />
      </main>
    </div>
  );
}

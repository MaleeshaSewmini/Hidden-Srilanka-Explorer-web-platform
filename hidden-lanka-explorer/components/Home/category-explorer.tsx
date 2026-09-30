import Link from "next/link";
import SectionHeading from "@/components/ui/section-heading";
import { categories } from "@/lib/demo-data";

export default function CategoryExplorer() {
  return (
    <section className="section-padding bg-[#f6f1e8]">
      <div className="container-main">
        <SectionHeading
          eyebrow="Explore by experience"
          title="Find your kind of hidden Sri Lanka."
          description="From quiet beaches to mountain trails, discover places based on the experience you want."
        />

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/places?category=${encodeURIComponent(category.name)}`}
              className="group rounded-3xl border border-[#0b2417]/10 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[#c99a43]/50 hover:shadow-xl"
            >
              <div className="text-3xl">{category.icon}</div>

              <h3 className="mt-4 font-semibold text-[#0b2417]">
                {category.name}
              </h3>

              <p className="mt-2 text-xs leading-5 text-[#718078]">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
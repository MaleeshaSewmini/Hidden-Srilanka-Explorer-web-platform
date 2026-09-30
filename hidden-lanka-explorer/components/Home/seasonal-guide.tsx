import SectionHeading from "@/components/ui/section-heading";

const seasons = [
  {
    title: "Southwest Coast",
    months: "Dec – Mar",
    description:
      "Sunny beaches, calm seas and perfect coastal escapes along the south and west.",
    icon: "🌊",
  },
  {
    title: "East & Wildlife",
    months: "Apr – Sep",
    description:
      "Explore the eastern coast and combine it with Sri Lanka's wild national parks.",
    icon: "🐘",
  },
  {
    title: "Hill Country",
    months: "Jan – Mar",
    description:
      "Cool mountain weather, tea country, waterfalls and scenic hiking routes.",
    icon: "⛰️",
  },
  {
    title: "Cultural Triangle",
    months: "Year-round",
    description:
      "Ancient cities, temples, ruins and remarkable cultural landscapes.",
    icon: "🏛️",
  },
];

export default function SeasonalGuide() {
  return (
    <section className="section-padding bg-[#f6f1e8]">
      <div className="container-main">
        <SectionHeading
          eyebrow="Plan around the island"
          title="Where to go, and when."
          description="Sri Lanka changes dramatically with the seasons. Use the guide to plan your next escape."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {seasons.map((season) => (
            <div
              key={season.title}
              className="rounded-3xl border border-[#0b2417]/10 bg-white p-6"
            >
              <div className="text-3xl">{season.icon}</div>

              <div className="mt-5 text-xs font-semibold uppercase tracking-widest text-[#a77a2f]">
                {season.months}
              </div>

              <h3 className="mt-2 font-display text-2xl text-[#0b2417]">
                {season.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#718078]">
                {season.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
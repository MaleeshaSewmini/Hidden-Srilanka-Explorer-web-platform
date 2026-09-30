import SectionHeading from "@/components/ui/section-heading";

const contributors = [
  {
    name: "Island Explorer",
    username: "@islandexplorer",
    places: 42,
    reviews: 68,
    photos: 120,
  },
  {
    name: "Wild Lanka",
    username: "@wildlanka",
    places: 31,
    reviews: 51,
    photos: 94,
  },
  {
    name: "Mountain Walker",
    username: "@mountainwalker",
    places: 27,
    reviews: 43,
    photos: 81,
  },
  {
    name: "Coastal Soul",
    username: "@coastalsoul",
    places: 19,
    reviews: 37,
    photos: 72,
  },
];

export default function Contributors() {
  return (
    <section className="section-padding bg-[#f6f1e8]">
      <div className="container-main">
        <SectionHeading
          eyebrow="People behind the map"
          title="Top contributors."
          description="The explorers who help keep Hidden Lanka growing."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contributors.map((person) => (
            <div
              key={person.username}
              className="rounded-3xl border border-[#0b2417]/10 bg-white p-6"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0b2417] font-display text-2xl text-[#f1cf88]">
                {person.name.charAt(0)}
              </div>

              <h3 className="mt-5 font-semibold text-[#0b2417]">
                {person.name}
              </h3>

              <p className="text-sm text-[#718078]">
                {person.username}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="font-semibold">{person.places}</div>
                  <div className="text-[#718078]">Places</div>
                </div>

                <div>
                  <div className="font-semibold">{person.reviews}</div>
                  <div className="text-[#718078]">Reviews</div>
                </div>

                <div>
                  <div className="font-semibold">{person.photos}</div>
                  <div className="text-[#718078]">Photos</div>
                </div>
              </div>

              <button
                type="button"
                className="mt-6 w-full rounded-full border border-[#0b2417]/15 py-2.5 text-sm font-semibold hover:bg-[#0b2417] hover:text-white"
              >
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
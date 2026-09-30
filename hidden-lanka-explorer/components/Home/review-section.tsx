import SectionHeading from "@/components/ui/section-heading";

const reviews = [
  {
    name: "Community Explorer",
    place: "Hiriketiya Bay",
    rating: 5,
    text: "A beautiful place away from the busy tourist areas. The community recommendations made the trip much easier.",
  },
  {
    name: "Island Wanderer",
    place: "Knuckles Mountain Range",
    rating: 5,
    text: "The hiking information was incredibly useful. The scenery was even better than expected.",
  },
  {
    name: "Travel Photographer",
    place: "Bambarakanda Falls",
    rating: 4,
    text: "A spectacular waterfall surrounded by incredible mountain scenery.",
  },
  {
    name: "Weekend Explorer",
    place: "Pottuvil Lagoon",
    rating: 5,
    text: "Peaceful, beautiful and completely different from the usual beach experience.",
  },
];

export default function ReviewsSection() {
  return (
    <section className="section-padding bg-[#ede5d7]">
      <div className="container-main">
        <SectionHeading
          eyebrow="From the community"
          title="Stories from people who went there."
          description="Real experiences help fellow explorers understand what a place is actually like."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reviews.map((review) => (
            <article
              key={`${review.name}-${review.place}`}
              className="rounded-3xl bg-white p-6"
            >
              <div className="flex gap-1 text-[#c99a43]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index}>
                    {index < review.rating ? "★" : "☆"}
                  </span>
                ))}
              </div>

              <p className="mt-5 text-sm leading-7 text-[#4f5e55]">
                “{review.text}”
              </p>

              <div className="mt-6 border-t border-[#0b2417]/10 pt-4">
                <div className="font-semibold text-[#0b2417]">
                  {review.name}
                </div>

                <div className="mt-1 text-xs text-[#718078]">
                  Visited {review.place}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
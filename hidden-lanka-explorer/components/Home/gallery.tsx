import Image from "next/image";
import SectionHeading from "@/components/ui/section-heading";

const gallery = [
  {
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80",
    title: "Ancient Sri Lanka",
  },
  {
    image:
      "https://images.unsplash.com/photo-1588598198321-9735fd524f09?auto=format&fit=crop&w=1000&q=80",
    title: "Mountain landscapes",
  },
  {
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
    title: "Hidden coast",
  },
  {
    image:
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1000&q=80",
    title: "Waterfalls",
  },
];

export default function Gallery() {
  return (
    <section className="section-padding bg-[#ede5d7]">
      <div className="container-main">
        <SectionHeading
          eyebrow="Community gallery"
          title="See Sri Lanka through local eyes."
          description="Photos shared by people exploring beyond the usual routes."
        />

        <div className="mt-10 grid auto-rows-[220px] grid-cols-2 gap-3 md:grid-cols-4">
          {gallery.map((item, index) => (
            <div
              key={item.title}
              className={`relative overflow-hidden rounded-3xl ${
                index === 0
                  ? "col-span-2 row-span-2"
                  : index === 1
                    ? "row-span-2"
                    : ""
              }`}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition duration-500 hover:scale-105"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16 text-white">
                <span className="text-sm font-semibold">{item.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
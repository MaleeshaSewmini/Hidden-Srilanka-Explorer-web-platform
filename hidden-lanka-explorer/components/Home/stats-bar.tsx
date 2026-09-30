const stats = [
  ["250+", "Hidden Places"],
  ["25", "Districts"],
  ["1,200+", "Community Photos"],
  ["8,500+", "Explorers"],
];

export default function StatsBar() {
  return (
    <section className="bg-[#0b2417] text-white">
      <div className="container-main grid grid-cols-2 divide-white/10 md:grid-cols-4 md:divide-x">
        {stats.map(([number, label]) => (
          <div
            key={label}
            className="px-5 py-8 text-center md:px-8"
          >
            <div className="font-display text-3xl text-[#f1cf88] sm:text-4xl">
              {number}
            </div>

            <div className="mt-1 text-sm text-white/55">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
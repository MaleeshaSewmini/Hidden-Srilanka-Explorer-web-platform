"use client";

import { useEffect, useState } from "react";

const stats = [
  ["250+", "Hidden Places"],
  ["25", "Districts"],
  ["500+", "Community Photos"],
  ["200+", "Explorers"],
];

function CountUp({ number }: { number: string }) {
  const [count, setCount] = useState(0);

  const target = parseInt(number.replace("+", ""), 10);
  const suffix = number.includes("+") ? "+" : "";

  useEffect(() => {
    const duration = 1800;
    let startTime: number | undefined;
    let frameId = 0;

    const animate = (time: number) => {
      if (startTime === undefined) {
        startTime = time;
      }

      const progress = Math.min(
        (time - startTime) / duration,
        1
      );

      const eased = 1 - Math.pow(1 - progress, 4);

      setCount(Math.floor(eased * target));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [target]);

  return (
    <>
      {count}
      {suffix}
    </>
  );
}

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
              <CountUp number={number} />
            </div>

            <div className="mt-1 text-sm text-white/55">
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
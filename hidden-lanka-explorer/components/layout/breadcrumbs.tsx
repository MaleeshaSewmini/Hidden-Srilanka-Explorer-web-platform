"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  "forgot-password": "Forgot Password",
  "reset-password": "Reset Password",
  "sign-in": "Sign In",
  "sign-up": "Sign Up",
  new: "Add Place",
};

function formatSegment(segment: string) {
  const label = LABELS[segment] ?? segment.replace(/[-_]/g, " ");
  return label.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: { label: string; href?: string }[] = [
    { label: "Home", href: "/" },
  ];
  let href = "";

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    href += `/${segment}`;

    if (segment === "share" && segments[index + 1]) {
      crumbs.push({ label: "Shared Trip" });
      break;
    }

    crumbs.push({
      label: formatSegment(decodeURIComponent(segment)),
      href: index < segments.length - 1 ? href : undefined,
    });
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="w-full border-y-2 border-[#d1d5db] bg-white"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <div className="container-main py-4">
        <ol className="flex flex-wrap items-center gap-2.5 text-[18px] leading-6 text-[#6b7280]">
          {crumbs.map((crumb, index) => {
            const isCurrent = index === crumbs.length - 1;
            const isHome = index === 0;

            return (
              <li
                key={`${crumb.label}-${index}`}
                className="flex items-center gap-2.5"
              >
                {index > 0 && (
                  <ChevronRight
                    size={16}
                    className="text-[#9ca3af]"
                    aria-hidden="true"
                  />
                )}

                {crumb.href && !isCurrent ? (
                  <Link
                    href={crumb.href}
                    className="inline-flex items-center gap-1.5 font-normal text-[#6b7280] transition-colors hover:text-[#0b2417] hover:underline underline-offset-4"
                  >
                    {isHome && <Home size={16} aria-hidden="true" />}
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className="font-bold text-[#0b2417]"
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
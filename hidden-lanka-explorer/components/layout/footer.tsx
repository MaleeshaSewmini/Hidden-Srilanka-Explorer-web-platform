import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#0b2417] text-white">
      <div className="container-main py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div>
            <h2 className="font-display text-3xl">
              Hidden Lanka
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-7 text-white/60">
              Discover the places, people and stories that make Sri Lanka
              unforgettable.
            </p>

            {/* Social Media */}
            <div className="mt-6 flex gap-3">
              {/* Instagram */}
              <a
                href="#"
                aria-label="Instagram"
                className="rounded-full border border-white/10 p-2 transition-all duration-200 hover:bg-white/10 hover:text-white"
              >
                <FaInstagram size={18} />
              </a>

              {/* Facebook */}
              <a
                href="#"
                aria-label="Facebook"
                className="rounded-full border border-white/10 p-2 transition-all duration-200 hover:bg-white/10 hover:text-white"
              >
                <FaFacebookF size={18} />
              </a>

              {/* Twitter */}
              <a
                href="#"
                aria-label="Twitter"
                className="rounded-full border border-white/10 p-2 transition-all duration-200 hover:bg-white/10 hover:text-white"
              >
                <FaTwitter size={18} />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold">
              Explore
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-white/60">
              <Link href="/places" className="transition-colors hover:text-white">
                All Places
              </Link>

              <Link href="/map" className="transition-colors hover:text-white">
                Explore Map
              </Link>

              <Link href="/community" className="transition-colors hover:text-white">
                Community
              </Link>

              <Link href="/places/new" className="transition-colors hover:text-white">
                Add a Place
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold">
              Categories
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-white/60">
              <Link
                href="/places?category=beaches"
                className="transition-colors hover:text-white"
              >
                Beaches
              </Link>

              <Link
                href="/places?category=waterfalls"
                className="transition-colors hover:text-white"
              >
                Waterfalls
              </Link>

              <Link
                href="/places?category=temples"
                className="transition-colors hover:text-white"
              >
                Temples
              </Link>

              <Link
                href="/places?category=wildlife"
                className="transition-colors hover:text-white"
              >
                Wildlife
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold">
              Contact
            </h3>

            <div className="mt-4 flex flex-col gap-4 text-sm text-white/60">
              <div className="flex items-center gap-3">
                <MapPin
                  size={18}
                  className="shrink-0"
                />

                <span>Sri Lanka</span>
              </div>

              <a
                href="mailto:hello@hiddenlanka.com"
                className="flex items-center gap-3 transition-colors hover:text-white"
              >
                <Mail
                  size={18}
                  className="shrink-0"
                />

                <span>
                  hello@hiddenlanka.com
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-white/40">
          © {new Date().getFullYear()} Hidden Lanka Explorer. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
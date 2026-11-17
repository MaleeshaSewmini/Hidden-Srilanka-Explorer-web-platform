import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function LegalPage({ title, description, children }: LegalPageProps) {
  return (
    <div className="legal-page">
      <nav className="legal-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/community">Community</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>

      <header className="legal-header">
        <p className="legal-eyebrow">Hidden Lanka Explorer</p>
        <h1>{title}</h1>
        <p className="legal-lead">{description}</p>
        <p className="legal-updated">Last updated: November 17, 2026</p>
      </header>

      <article className="legal-content">{children}</article>

      <p className="legal-contact">
        Questions or concerns? Email{" "}
        <a href="mailto:hello@hiddenlanka.com">hello@hiddenlanka.com</a>.
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Hidden Lanka Explorer",
  description:
    "Terms for using Hidden Lanka Explorer and its travel community features.",
};

const styles = `
.tp-page {
  min-height: 100vh;
  background: #ffffff;
  color: #000000;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  padding: 48px 24px 80px;
}

.tp-container {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.tp-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 40px;
  color: #000000;
  font-size: 16px;
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.tp-back:hover {
  border-bottom-color: #000000;
}

.tp-header {
  padding-bottom: 32px;
  margin-bottom: 8px;
  border-bottom: 2px solid #000000;
}

.tp-brand {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.tp-title {
  margin: 0 0 16px;
  font-size: 40px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.tp-description {
  margin: 0;
  max-width: 620px;
  font-size: 16px;
  line-height: 1.7;
}

.tp-section {
  padding: 28px 0;
  border-bottom: 1px solid #e0e0e0;
}

.tp-section h2 {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
}

.tp-section p {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
}

.tp-section p + p {
  margin-top: 12px;
}

.tp-page a.tp-link {
  color: #000000;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.tp-page a.tp-link:hover {
  text-decoration-thickness: 2px;
}

.tp-back:focus-visible,
.tp-page a.tp-link:focus-visible {
  outline: 3px solid #000000;
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .tp-page {
    padding: 28px 18px 56px;
  }

  .tp-back {
    margin-bottom: 28px;
  }

  .tp-title {
    font-size: 32px;
  }

  .tp-section {
    padding: 24px 0;
  }

  .tp-section h2 {
    font-size: 18px;
  }
}

@media print {
  .tp-page {
    padding: 0;
  }

  .tp-back {
    display: none;
  }
}
`;

export default function TermsPage() {
  return (
    <main className="tp-page">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="tp-container">
        <Link href="/" className="tp-back">
          <span aria-hidden="true">←</span> Back to home
        </Link>

        <header className="tp-header">
          <p className="tp-brand">Hidden Lanka Explorer</p>
          <h1 className="tp-title">Terms of Service</h1>
          <p className="tp-description">
            These terms explain the basic rules for using Hidden Lanka
            Explorer.
          </p>
        </header>

        <article>
          <section className="tp-section">
            <h2>1. Using the platform</h2>
            <p>
              Hidden Lanka Explorer helps people discover places in Sri Lanka
              and share travel experiences. The site is an information and
              community platform; it does not operate or guarantee transport,
              accommodation, tours, or other services described by users or
              linked websites.
            </p>
          </section>

          <section className="tp-section">
            <h2>2. Your account</h2>
            <p>
              Keep your account information accurate, protect your sign-in
              details, and contact us if you believe someone has used your
              account without permission. You are responsible for activity
              carried out through your account, subject to rights that cannot
              be limited by law.
            </p>
          </section>

          <section className="tp-section">
            <h2>3. Profiles and content you share</h2>
            <p>
              You keep ownership of content you submit. You confirm that you
              have the rights and permissions needed to share it. You give
              Hidden Lanka Explorer a non-exclusive, worldwide, royalty-free
              permission to host, store, reproduce, and display that content as
              needed to operate and present the platform. This permission ends
              when the content is removed, except where retention is needed for
              backups, safety, or legal obligations.
            </p>
            <p>
              Profile details, reviews, tips, and other contributions may be
              visible to other visitors. Do not publish information you want to
              keep confidential.
            </p>
          </section>

          <section className="tp-section">
            <h2>4. Community conduct</h2>
            <p>
              Follow our{" "}
              <Link className="tp-link" href="/community-guidelines">
                Community Guidelines
              </Link>
              . Do not use the platform to break the law, threaten or harass
              others, impersonate someone, infringe another person&apos;s
              rights, send spam, or interfere with the security or operation of
              the site.
            </p>
          </section>

          <section className="tp-section">
            <h2>5. Private chats</h2>
            <p>
              Private chats are available to users with community profiles and
              are intended for the participants in each conversation. Use them
              respectfully, and do not send passwords, financial details, or
              other sensitive information.
            </p>
          </section>

          <section className="tp-section">
            <h2>6. Travel information and safety</h2>
            <p>
              Place details, reviews, routes, access conditions, and safety
              tips can be incomplete, subjective, or out of date. Conditions
              can change. Check current local guidance, permissions, weather,
              and safety conditions before travelling. You are responsible for
              your own decisions and for respecting local laws, communities,
              and land access rules.
            </p>
          </section>

          <section className="tp-section">
            <h2>7. Moderation and availability</h2>
            <p>
              We may review, restrict, or remove content, or suspend access to
              accounts, when reasonably needed to enforce these terms, protect
              people or the platform, or comply with law. We may update or
              discontinue features, and we cannot promise the site will always
              be available or error-free.
            </p>
          </section>

          <section className="tp-section">
            <h2>8. Disclaimers</h2>
            <p>
              The platform and its user-submitted information are provided on
              an &quot;as available&quot; basis. To the extent allowed by
              applicable law, Hidden Lanka Explorer does not guarantee that user
              content is accurate, that a place is safe or accessible, or that
              the platform will meet every user&apos;s needs. Nothing in these
              terms excludes rights or responsibilities that cannot legally be
              excluded.
            </p>
          </section>

          <section className="tp-section">
            <h2>9. Changes and contact</h2>
            <p>
              We may update these terms as the service changes. The latest
              version and its update date will be posted on this page. For
              questions, email{" "}
              <a className="tp-link" href="mailto:hello@hiddenlanka.com">
                hello@hiddenlanka.com
              </a>
              .
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
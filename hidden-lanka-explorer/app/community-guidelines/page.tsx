import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Community Guidelines | Hidden Lanka Explorer",
  description:
    "Guidelines for sharing travel information and chatting on Hidden Lanka Explorer.",
};

const styles = `
.cg-page {
  min-height: 100vh;
  background: #ffffff;
  color: #000000;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  padding: 48px 24px 80px;
}

.cg-container {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.cg-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 40px;
  color: #000000;
  font-size: 16px;
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.cg-back:hover {
  border-bottom-color: #000000;
}

.cg-header {
  padding-bottom: 32px;
  margin-bottom: 8px;
  border-bottom: 2px solid #000000;
}

.cg-brand {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.cg-title {
  margin: 0 0 16px;
  font-size: 40px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.cg-description {
  margin: 0;
  max-width: 620px;
  font-size: 16px;
  line-height: 1.7;
}

.cg-content {
  counter-reset: section;
}

.cg-section {
  counter-increment: section;
  padding: 28px 0;
  border-bottom: 1px solid #e0e0e0;
}

.cg-section h2 {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
}

.cg-section h2::before {
  content: counter(section, decimal-leading-zero);
  flex: 0 0 auto;
  font-size: 16px;
  font-weight: 700;
  padding: 2px 8px;
  border: 1px solid #000000;
  border-radius: 4px;
  line-height: 1.4;
}

.cg-section p {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
}

.cg-page a.cg-link {
  color: #000000;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.cg-page a.cg-link:hover {
  text-decoration-thickness: 2px;
}

.cg-back:focus-visible,
.cg-page a.cg-link:focus-visible {
  outline: 3px solid #000000;
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .cg-page {
    padding: 28px 18px 56px;
  }

  .cg-back {
    margin-bottom: 28px;
  }

  .cg-title {
    font-size: 32px;
  }

  .cg-section {
    padding: 24px 0;
  }

  .cg-section h2 {
    font-size: 18px;
    gap: 12px;
  }
}

@media print {
  .cg-page {
    padding: 0;
  }

  .cg-back {
    display: none;
  }
}
`;

export default function CommunityGuidelinesPage() {
  return (
    <main className="cg-page">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="cg-container">
        <Link href="/" className="cg-back">
          <span aria-hidden="true">←</span> Back to home
        </Link>

        <header className="cg-header">
          <p className="cg-brand">Hidden Lanka Explorer</p>
          <h1 className="cg-title">Community Guidelines</h1>
          <p className="cg-description">
            Help make this a welcoming, useful, and responsible space for
            explorers and local communities.
          </p>
        </header>

        <article className="cg-content">
          <section className="cg-section">
            <h2>Be respectful</h2>
            <p>
              Treat other explorers and local residents with courtesy.
              Harassment, threats, hate, discrimination, and personal attacks
              have no place in reviews, discussions, profiles, or chats.
            </p>
          </section>

          <section className="cg-section">
            <h2>Share honest, useful information</h2>
            <p>
              Describe your own experience accurately, distinguish opinion from
              fact, and avoid presenting old conditions as current. Do not
              fabricate reviews, impersonate others, or post misleading safety
              or access information.
            </p>
          </section>

          <section className="cg-section">
            <h2>Protect people, wildlife, and places</h2>
            <p>
              Respect sacred sites, private property, local customs, and access
              restrictions. Do not encourage trespassing or unsafe activity.
              Avoid sharing precise directions to fragile places or sensitive
              wildlife locations when that could put them at risk.
            </p>
          </section>

          <section className="cg-section">
            <h2>Respect privacy and content rights</h2>
            <p>
              Share only photos, writing, and other material you have
              permission to use. Do not post someone&apos;s private
              information, credentials, private messages, or images without
              their consent.
            </p>
          </section>

          <section className="cg-section">
            <h2>Use private chats responsibly</h2>
            <p>
              Keep conversations considerate and relevant. Do not use chats for
              harassment, spam, scams, or unwanted repeated contact. A chat is
              intended for its participants; do not redistribute another
              participant&apos;s messages without permission.
            </p>
          </section>

          <section className="cg-section">
            <h2>No spam or harmful activity</h2>
            <p>
              Do not use the community for scams, unsolicited advertising,
              misleading promotions, or attempts to disrupt or access accounts
              and systems without permission.
            </p>
          </section>

          <section className="cg-section">
            <h2>How we respond</h2>
            <p>
              We may remove content or restrict accounts that do not follow
              these guidelines. To raise a concern, email{" "}
              <a className="cg-link" href="mailto:hello@hiddenlanka.com">
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
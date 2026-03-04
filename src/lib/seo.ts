import type { Metadata } from "next";

const SITE_NAME = "Givezy";
const SITE_URL = "https://givezy.in";
const SITE_DESCRIPTION =
  "Donate books and clothes in Hyderabad with free doorstep pickup. Give your pre-loved items a second life — we collect from your home.";

export function buildMetadata(overrides: Partial<Metadata> = {}): Metadata {
  const title = overrides.title
    ? `${overrides.title} | ${SITE_NAME}`
    : `${SITE_NAME} — Donate Books & Clothes in Hyderabad | Free Pickup`;

  const description =
    (overrides.description as string) || SITE_DESCRIPTION;

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    openGraph: {
      title: title as string,
      description,
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
      url: SITE_URL,
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Givezy — Donate Books & Clothes in Hyderabad with Free Pickup",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title as string,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    icons: {
      icon: "/icon-192.png",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.json",
    robots: {
      index: true,
      follow: true,
    },
    ...overrides,
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    areaServed: {
      "@type": "City",
      name: "Hyderabad",
      containedInPlace: {
        "@type": "State",
        name: "Telangana",
        containedInPlace: {
          "@type": "Country",
          name: "India",
        },
      },
    },
    serviceType: "Donation Pickup",
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${SITE_NAME} — Donation Pickup Hyderabad`,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
    priceRange: "Free",
  };
}

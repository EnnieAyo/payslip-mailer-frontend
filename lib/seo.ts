import { Metadata } from 'next';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  noIndex?: boolean;
  canonical?: string;
  ogImage?: string;
}

export function generatePageMetadata({
  title,
  description,
  keywords = [],
  noIndex = true,
  canonical,
  ogImage,
}: SEOConfig): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Payslip Mailer';

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : undefined,
    alternates: canonical
      ? {
          canonical: `${baseUrl}${canonical}`,
        }
      : undefined,
    openGraph: {
      title: `${title} | ${appName}`,
      description,
      url: canonical ? `${baseUrl}${canonical}` : baseUrl,
      siteName: appName,
      type: 'website',
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${appName}`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

// Structured data schemas
export function generateOrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Payslip Mailer';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: appName,
    url: baseUrl,
    description: 'Secure and efficient employee payslip management system',
    applicationCategory: 'BusinessApplication',
  };
}

export function generateWebApplicationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Payslip Mailer';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: appName,
    url: baseUrl,
    description: 'Secure and efficient employee payslip management system',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}

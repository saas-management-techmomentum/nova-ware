import { useEffect } from "react";

type SeoProps = {
  title: string;
  description?: string;
  canonical?: string;
  jsonLd?: object;
};

const Seo = ({ title, description, canonical, jsonLd }: SeoProps) => {
  useEffect(() => {
    document.title = title;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }

    const existingJsonLd = document.getElementById('page-json-ld');
    if (existingJsonLd) existingJsonLd.remove();

    if (jsonLd) {
      const script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.id = 'page-json-ld';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, jsonLd]);

  return null;
};

export default Seo;

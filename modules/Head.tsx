import { ReactElement, memo } from "react";

import MetaTags from "react-helmet";

interface HeadProps {
  title: string;
  description: string;
  url: string;
  image: string;
  children?: ReactElement<"meta" | "link"> | ReactElement<"meta" | "link">[];
}

const Head = memo(({ title, description, url, image, children }: HeadProps) => {
  return (
    <MetaTags>
      <title>{title}</title>
      <link rel="icon" href={image} />
      <link rel="apple-touch-icon" href={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />
      <meta property="og:title" content={title} />
      <meta property="og:site_name" content={title} />
      <meta name="description" content={description} />
      <meta property="og:description" content={description} />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:domain" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:description" content={description} />
      <meta name="theme-color" content="#000000" />
      {children}
    </MetaTags>
  );
});

export default Head;

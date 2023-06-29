import Helmet from "react-helmet";

export default ({ title, description, url, image, children }) => {
  const defaultMetaProps = {
    url,
    image,
    title,
    description,
  };

  const metaProps = {
    "": ["url", "title", "description"],
    "og:": ["url", "type", "image", "title", "site_name", "description"],
    "twitter:": [
      "url",
      "domain",
      "title",
      "image",
      "site",
      "card",
      "description",
    ],
  };

  return (
    <Helmet>
      {Object.entries(metaProps).map(([prefix, properties]) =>
        properties.map((property) => (
          <meta
            key={`${prefix}${property}`}
            property={`${prefix}${property}`}
            content={defaultMetaProps[property]}
          />
        ))
      )}
      <link rel="icon" href={image} />
      <link rel="apple-touch-icon" href={image} />
      <meta name="theme-color" content="#000000" />
      {children}
    </Helmet>
  );
};

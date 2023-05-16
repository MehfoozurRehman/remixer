import React, { memo } from "react";

import useImage from "./useImage";

const Img = memo(({ src, suspense = false, ...props }) => {
  const { src: source } = useImage({ srcList: [src], useSuspense: suspense });
  return <img src={source} {...props} />;
});

export default Img;

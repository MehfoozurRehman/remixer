import React, { Suspense, memo, useEffect, useState } from "react";

const SuspenseAfterInitialRender = memo(({ fallback, children }) => {
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    setIsInitialRender(false);
  }, []);

  if (isInitialRender) return <>{children}</>;

  return <Suspense fallback={fallback}>{children}</Suspense>;
});

export default SuspenseAfterInitialRender;

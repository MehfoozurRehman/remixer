import { Suspense, memo, useRef } from "react";

export default memo(({ fallback, children }) => {
  const isInitialRenderRef = useRef(true);
  isInitialRenderRef.current = false;

  if (isInitialRenderRef.current) return <>{children}</>;

  return <Suspense fallback={fallback}>{children}</Suspense>;
});

import { Suspense, memo, useEffect, useState } from "react";

interface Props {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

const SuspenseAfterInitialRender = memo(({ fallback, children }: Props) => {
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    setIsInitialRender(false);
  }, []);

  if (isInitialRender) return <>{children}</>;

  return <Suspense fallback={fallback}>{children}</Suspense>;
});

export default SuspenseAfterInitialRender;

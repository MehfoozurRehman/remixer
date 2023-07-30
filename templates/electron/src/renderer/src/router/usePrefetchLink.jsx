import { useCallback, useEffect, useState } from "react";

import getMatchingRoute from "./getMatchingRoute";

export default (to, prefetch = true) => {
  const [prefetched, setPrefetched] = useState(false);

  useEffect(() => {
    const route = getMatchingRoute(to);
    const preload = () => route?.preload() && setPrefetched(true);
    const prefetchable = Boolean(route && !prefetched);

    if (prefetchable && prefetch) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            preload();
            observer.unobserve(ref.current);
          }
        },
        { rootMargin: "200px" }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }

    return undefined;
  }, [to, prefetch, prefetched]);

  const handleMouseEnter = useCallback(() => {
    if (prefetched) return;
    const route = getMatchingRoute(to);
    if (route) {
      route.preload();
      setPrefetched(true);
    }
  }, [to, prefetched]);

  return { handleMouseEnter };
};

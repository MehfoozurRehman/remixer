import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link as RouterLink } from "react-router-dom";
import { getMatchingRoute } from "../router/GetMatchingRoute";

const Link = memo(({ to, prefetch = true, ...props }) => {
  const ref = useRef(null);
  const [prefetched, setPrefetched] = useState(false);

  const route = useMemo(() => getMatchingRoute(to), [to]);
  const preload = useCallback(() => {
    route?.preload();
    setPrefetched(true);
  }, [route]);

  const prefetchable = useMemo(
    () => Boolean(route && !prefetched),
    [route, prefetched]
  );

  useEffect(() => {
    if (!prefetchable || !prefetch || !ref?.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          preload();
          observer.unobserve(ref.current!);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, [prefetchable, prefetch, ref, preload]);

  const handleMouseEnter = useCallback(() => {
    if (prefetchable) preload();
  }, [prefetchable, preload]);

  return (
    <RouterLink ref={ref} to={to} onMouseEnter={handleMouseEnter} {...props} />
  );
});

export default Link;

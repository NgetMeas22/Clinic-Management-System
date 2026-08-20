import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// Keeps a local search term in sync with the `?search=` URL param.
// Lets the global navbar search drop you onto any list page pre-filtered.
export default function useUrlSearch(key = "search") {
  const [searchParams] = useSearchParams();
  const [term, setTerm] = useState(() => searchParams.get(key) || "");

  useEffect(() => {
    const urlTerm = searchParams.get(key) || "";
    if (urlTerm !== term) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync external URL param into local state
      setTerm(urlTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, key]);

  return [term, setTerm];
}
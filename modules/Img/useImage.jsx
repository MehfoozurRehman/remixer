import imagePromiseFactory from "./imagePromiseFactory";
import { promiseFind } from "./promiseFind";
import { useState } from "react";

const removeBlankArrayElements = (a) => a.filter((x) => x);
const stringToArray = (x) => (Array.isArray(x) ? x : [x]);
const cache = {};

export default function useImage({
  srcList,
  imgPromise = imagePromiseFactory({ decode: true }),
  useSuspense = true,
}) {
  const [, setIsSettled] = useState(false);
  const sourceList = removeBlankArrayElements(stringToArray(srcList));
  const sourceKey = sourceList.join("");

  if (!cache[sourceKey]) {
    // create promise to loop through sources and try to load one
    cache[sourceKey] = {
      promise: promiseFind(sourceList, imgPromise),
      cache: "pending",
      error: null,
    };
  }

  // when promise resolves/reject, update cache & state
  if (cache[sourceKey].cache === "resolved") {
    return { src: cache[sourceKey].src, isLoading: false, error: null };
  }

  if (cache[sourceKey].cache === "rejected") {
    if (useSuspense) throw cache[sourceKey].error;
    return { isLoading: false, error: cache[sourceKey].error, src: undefined };
  }

  cache[sourceKey].promise
    // if a source was found, update cache
    // when not using suspense, update state to force a rerender
    .then((src) => {
      cache[sourceKey] = { ...cache[sourceKey], cache: "resolved", src };
      if (!useSuspense) setIsSettled(sourceKey);
    })

    // if no source was found, or if another error occurred, update cache
    // when not using suspense, update state to force a rerender
    .catch((error) => {
      cache[sourceKey] = { ...cache[sourceKey], cache: "rejected", error };
      if (!useSuspense) setIsSettled(sourceKey);
    });

  // cache[sourceKey].cache === 'pending')
  if (useSuspense) throw cache[sourceKey].promise;
  return { isLoading: true, src: undefined, error: null };
}

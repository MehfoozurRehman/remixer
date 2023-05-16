// sequential map.find for promises
export const promiseFind = (arr, promiseFactory) => {
  let done = false;
  return new Promise((resolve, reject) => {
    const queueNext = (src) => {
      return promiseFactory(src).then(() => {
        done = true;
        resolve(src);
      });
    };

    arr
      .reduce((p, src) => {
        // ensure we aren't done before enqueuing the next source
        return p.catch(() => {
          if (!done) return queueNext(src);
        });
      }, queueNext(arr.shift()))
      .catch(reject);
  });
};

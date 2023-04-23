// sequential map.find for promises
export const promiseFind = (arr: any[], promiseFactory: { (...args: any[]): Promise<void>; (arg0: any): Promise<any>; }) => {
  let done = false;
  return new Promise((resolve, reject) => {
    const queueNext = (src: unknown) => {
      return promiseFactory(src).then(() => {
        done = true;
        resolve(src);
      });
    };

    arr
      .reduce((p: Promise<any>, src: any) => {
        // ensure we aren't done before enqueuing the next source
        return p.catch(() => {
          if (!done)
            return queueNext(src);
        });
      }, queueNext(arr.shift()))
      .catch(reject);
  });
};

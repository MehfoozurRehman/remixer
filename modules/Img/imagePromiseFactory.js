export default function createPromiseImage({
  decode = true,
  crossOrigin = "",
}) {
  return function (src) {
    const img = new Image();

    if (crossOrigin) {
      img.crossOrigin = crossOrigin;
    }

    return new Promise((resolve, reject) => {
      img.onload = () => {
        if (decode && img.decode) {
          img.decode().then(resolve).catch(reject);
        } else {
          resolve();
        }
      };

      img.onerror = reject;
      img.src = src;
    });
  };
}

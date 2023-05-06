import { memo } from "react";
import useImage from "./useImage";

interface ImgProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  suspense?: boolean;
}

const Img = memo(({ src, suspense = false, ...props }: ImgProps) => {
  const { src: source } = useImage({ srcList: [src], useSuspense: suspense });
  return <img src={source} {...props} />;
});

export default Img;

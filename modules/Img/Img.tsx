import useImage from "./useImage";

interface ImgProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  suspense?: boolean;
}

export default function Img({ src, suspense = false, ...props }: ImgProps) {
  const { src: source } = useImage({ srcList: [src], useSuspense: suspense });
  return <img src={source} {...props} />;
}

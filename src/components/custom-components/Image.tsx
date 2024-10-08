import { useState } from "react";
import ImageLoader from "./ImageLoader";

interface ImageProps {
    key: number,
    src: string,
    className: string,
    width: number,
}

const Image: React.FC<ImageProps> = ({ src, width, height, className, key }) => {
  const [loading, setLoading] = useState(true); // Initially, the image is loading

  const handleImageLoad = () => {
    setLoading(false); // Image has finished loading
  };

  const handleImageError = () => {
    setLoading(false); // Handle error case (e.g., if the image fails to load)
  };

  return (
    <div>
      {loading && <ImageLoader width={width} className={className} />}
      <img 
        key={key}
        src={src}
        className={className}
        style={{width: width}}
        onLoad={handleImageLoad} 
        onError={handleImageError} 
      />
    </div>
  );
};

export default Image;

import React, { useState } from 'react';
import ContentLoader from 'react-content-loader';

interface ImageLoaderProps {
    width: number,
    className: string
}

const ImageLoader: React.FC<ImageLoaderProps> = ({ width, className }) => (
  <ContentLoader 
    className={className}
    speed={2}
    width={width}
    height={"100%"}
    viewBox={`0 0 ${width} ${width / 1.5}`}
    backgroundColor="#f3f3f3"
    foregroundColor="#ecebeb"
  >
    <rect x="0" y="0" rx="5" ry="5" width={width} height={width / 1.5} />
  </ContentLoader>
);

export default ImageLoader;
import { Image, type ImageProps } from 'expo-image';
import React, { useEffect, useState } from 'react';

type Props = Omit<ImageProps, 'source'> & {
  uri?: string | null;
  fallbackUri: string;
};

export function FallbackImage({ uri, fallbackUri, onError, ...props }: Props) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  return (
    <Image
      {...props}
      source={{ uri: hasError || !uri ? fallbackUri : uri }}
      onError={(event) => {
        setHasError(true);
        onError?.(event);
      }}
    />
  );
}
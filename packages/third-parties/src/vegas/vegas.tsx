'use client';

import * as React from 'react';
import { Vegas as VegasMaster, type VegasSettings } from 'src/vegas/vegas.class';

interface VegasProps {
  options: Partial<VegasSettings>;
}

export function VegasComponent({ options }: VegasProps): React.JSX.Element {
  const vegasRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (vegasRef.current) {
      const vegasInstance = new VegasMaster(vegasRef.current, options);

      // Cleanup on unmounting
      return () => {
        vegasInstance.destroy();
      };
    }
  }, [options]);

  return <div ref={vegasRef} />;
}

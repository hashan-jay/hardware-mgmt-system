import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface Props {
  value: string;
  height?: number;
  displayValue?: boolean;
}

export default function Barcode({ value, height = 60, displayValue = true }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    JsBarcode(svgRef.current, value, {
      format: 'CODE128',
      displayValue,
      height,
      margin: 8,
      fontSize: 12,
      background: '#ffffff',
      lineColor: '#142033',
    });
  }, [value, height, displayValue]);

  return <svg ref={svgRef} className="max-w-full" />;
}

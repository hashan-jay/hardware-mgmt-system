/// <reference types="vite/client" />

declare module 'jsbarcode' {
  export default function JsBarcode(
    element: string | HTMLElement | SVGSVGElement,
    data: string,
    options?: Record<string, unknown>,
  ): void;
}

import { useEffect, useState } from "react";
import { transport } from "./config/hl.js";
import { SymbolConverter } from "./lib/symbol-converter.js";

let converterPromise: Promise<SymbolConverter> | null = null;

export function getSymbolConverter() {
  if (!converterPromise) {
    converterPromise = (async () => {
      return SymbolConverter.create({ transport, dexs: true });
    })();
  }
  return converterPromise;
}

export function useSymbolConverter() {
  const [converter, setConverter] = useState<SymbolConverter | null>(null);
  useEffect(() => {
    getSymbolConverter().then(setConverter);
  }, []);

  return converter;
}

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const PRICING_FILE = join(process.cwd(), "data", "pricing.json");

export interface SizeRates {
  bwSingle: number;
  bwDouble: number;
  colorSingle: number;
  colorDouble: number;
  photoSingle: number;
  photoDouble: number;
}

export interface PricingConfig {
  short: SizeRates;
  long: SizeRates;
  a4: SizeRates;
}

const defaultSizeRates: SizeRates = {
  bwSingle: 5.0,
  bwDouble: 3.0,
  colorSingle: 20.0,
  colorDouble: 15.0,
  photoSingle: 20.0,
  photoDouble: 50.0,
};

const defaultPricing: PricingConfig = {
  short: { ...defaultSizeRates },
  long: { ...defaultSizeRates, bwSingle: 7.0, bwDouble: 5.0, colorSingle: 25.0, colorDouble: 20.0, photoSingle: 40.0, photoDouble: 80.0 },
  a4: { ...defaultSizeRates },
};

function migrateOldPricing(saved: Record<string, unknown>): PricingConfig {
  // If saved data has old flat format, convert to new nested format
  if ("bwSingleSided" in saved) {
    const old = saved as unknown as {
      bwSingleSided?: number;
      bwDoubleSided?: number;
      colorSingleSided?: number;
      colorDoubleSided?: number;
      photoSingleSided?: number;
      photoDoubleSided?: number;
    };
    const rates: SizeRates = {
      bwSingle: old.bwSingleSided ?? defaultSizeRates.bwSingle,
      bwDouble: old.bwDoubleSided ?? defaultSizeRates.bwDouble,
      colorSingle: old.colorSingleSided ?? defaultSizeRates.colorSingle,
      colorDouble: old.colorDoubleSided ?? defaultSizeRates.colorDouble,
      photoSingle: old.photoSingleSided ?? defaultSizeRates.photoSingle,
      photoDouble: old.photoDoubleSided ?? defaultSizeRates.photoDouble,
    };
    return { short: rates, long: rates, a4: rates };
  }
  return { ...defaultPricing, ...saved } as PricingConfig;
}

export async function getPricing(): Promise<PricingConfig> {
  try {
    const data = await readFile(PRICING_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return migrateOldPricing(parsed);
  } catch {
    return defaultPricing;
  }
}

export async function setPricing(pricing: Partial<PricingConfig>): Promise<PricingConfig> {
  const current = await getPricing();
  const updated: PricingConfig = {
    short: { ...current.short, ...pricing.short },
    long: { ...current.long, ...pricing.long },
    a4: { ...current.a4, ...pricing.a4 },
  };
  await writeFile(PRICING_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

function getRate(
  pricing: PricingConfig,
  paperSize: "SHORT" | "LONG" | "A4",
  color: boolean,
  duplex: boolean,
  photo: boolean
): number {
  const sizeKey = paperSize.toLowerCase() as "short" | "long" | "a4";
  const rates = pricing[sizeKey];
  if (!rates) return 0;

  if (photo) {
    return duplex ? rates.photoDouble : rates.photoSingle;
  }
  if (color) {
    return duplex ? rates.colorDouble : rates.colorSingle;
  }
  return duplex ? rates.bwDouble : rates.bwSingle;
}

export function calculateCost(
  pages: number,
  copies: number,
  paperSize: "SHORT" | "LONG" | "A4",
  color: boolean,
  duplex: boolean,
  pricing: PricingConfig
): number {
  const rate = getRate(pricing, paperSize, color, duplex, false);
  return parseFloat((pages * copies * rate).toFixed(2));
}

export function calculateDetailedCost(
  textPages: number,
  photoPages: number,
  copies: number,
  paperSize: "SHORT" | "LONG" | "A4",
  duplex: boolean,
  pricing: PricingConfig
): number {
  const textRate = getRate(pricing, paperSize, true, duplex, false);
  const photoRate = getRate(pricing, paperSize, true, duplex, true);
  const cost = (textPages * textRate + photoPages * photoRate) * copies;
  return parseFloat(cost.toFixed(2));
}

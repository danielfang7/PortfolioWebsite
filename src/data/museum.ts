import { getCollection, type CollectionEntry } from "astro:content";
import type { WorkRef, InvestmentRef } from "@/components/museum/data";

/**
 * Shared loader for the museum's exhibit data — works and investments — so the
 * full Lab page and the home-page preview stay perfectly in sync. Maps Astro
 * content collections into the lightweight refs the canvas engine consumes, and
 * assigns each investment a stable accent color (for its pedestal plaque +
 * summary modal).
 */

const INVESTMENT_COLORS = [
  "#A78BFA",
  "#00D8FF",
  "#F59E0B",
  "#34D399",
  "#EC4899",
  "#38BDF8",
];

/**
 * Per-work accent for the Workshop desks. Assigned by carousel order so a
 * project keeps the same color across visits, and cycled long enough that no
 * two neighbouring desks in the 4x2 grid share one.
 */
const WORK_COLORS = [
  "#00D8FF",
  "#F59E0B",
  "#A78BFA",
  "#34D399",
  "#EC4899",
  "#38BDF8",
  "#FB7185",
  "#FACC15",
];

export type MuseumData = {
  works: WorkRef[];
  investments: InvestmentRef[];
  /** Full collection entries, for the accessible list view. */
  workEntries: CollectionEntry<"works">[];
  investmentEntries: CollectionEntry<"investments">[];
};

export async function getMuseumData(): Promise<MuseumData> {
  const workEntries = (await getCollection("works")).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const works: WorkRef[] = workEntries.map((w, i) => ({
    slug: w.id.replace(/\.(md|mdx)$/, ""),
    title: w.data.title,
    description: w.data.description,
    role: w.data.role,
    year: w.data.year,
    stack: w.data.stack,
    thumbnail: w.data.thumbnail,
    liveUrl: w.data.liveUrl,
    sourceUrl: w.data.sourceUrl,
    color: WORK_COLORS[i % WORK_COLORS.length],
  }));

  const investmentEntries = (await getCollection("investments")).sort(
    (a, b) => b.data.year - a.data.year,
  );
  const investments: InvestmentRef[] = investmentEntries.map((inv, i) => ({
    slug: inv.id,
    company: inv.data.company,
    description: inv.data.description,
    sector: inv.data.sector,
    stage: inv.data.stage,
    year: String(inv.data.year),
    url: inv.data.url,
    logo: inv.data.logo,
    color: INVESTMENT_COLORS[i % INVESTMENT_COLORS.length],
  }));

  return { works, investments, workEntries, investmentEntries };
}

import "server-only";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type ScreeningStatus = "clear" | "review" | "error";

export type ScreeningCandidate = {
  name: string;
  referenceNumber: string;
  entryType: string;
  source: string;
  matchReason: string;
};

export type ScreeningResult = {
  status: ScreeningStatus;
  screenedName: string;
  screenedAt: string;
  source: string;
  message: string;
  candidates: ScreeningCandidate[];
};

const SOURCE_NAME = "UN Security Council Consolidated Sanctions List";

// Normalise names to make comparisons less sensitive to formatting.
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Compare the words in two names.
function similarityScore(nameA: string, nameB: string): number {
  const wordsA = new Set(normalizeName(nameA).split(" ").filter(Boolean));
  const wordsB = new Set(normalizeName(nameB).split(" ").filter(Boolean));

  if (wordsA.size === 0 || wordsB.size === 0) {
    return 0;
  }

  const sharedWords = [...wordsA].filter((word) => wordsB.has(word)).length;

  return (2 * sharedWords) / (wordsA.size + wordsB.size);
}

export async function screenIndividual(
  fullNames: string,
  surname: string,
): Promise<ScreeningResult> {
  const screenedName = `${fullNames} ${surname}`.trim();
  const normalizedApplicant = normalizeName(screenedName);
  const screenedAt = new Date().toISOString();

  // Fail safely if the customer name is missing.
  if (!normalizedApplicant) {
    return {
      status: "error",
      screenedName,
      screenedAt,
      source: SOURCE_NAME,
      message: "Customer name is missing. Screening could not be completed.",
      candidates: [],
    };
  }

  try {
    // Fetch all individual records in pages.
    const pageSize = 500;
    let entries: {
      primary_name: string;
      search_text: string;
      reference_number: string;
      entry_type: string;
      source_name: string;
    }[] = [];

    let from = 0;

    while (true) {
      const { data, error } = await supabaseAdmin
        .from("sanctions_entries")
        .select(
          "primary_name, search_text, reference_number, entry_type, source_name",
        )
        .eq("entry_type", "individual")
        .range(from, from + pageSize - 1);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        break;
      }

      entries = entries.concat(data);

      if (data.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    const candidates: ScreeningCandidate[] = [];

    for (const entry of entries) {
      const normalizedPrimaryName = normalizeName(entry.primary_name);
      const normalizedSearchText = normalizeName(entry.search_text);

      let matchReason: string | null = null;

      // Exact match against the primary listed name.
      if (normalizedApplicant === normalizedPrimaryName) {
        matchReason = "Exact name match";
      }

      // Exact name may also be present as an alias.
      else if (
        normalizedSearchText.includes(normalizedApplicant) &&
        normalizedApplicant.length >= 5
      ) {
        matchReason = "Possible exact match against a listed alias";
      }

      // Check for a strong similarity against the primary listed name.
      else if (similarityScore(screenedName, entry.primary_name) >= 0.75) {
        matchReason = "Strong name similarity";
      }

      if (matchReason) {
        candidates.push({
          name: entry.primary_name,
          referenceNumber: entry.reference_number,
          entryType: entry.entry_type,
          source: entry.source_name,
          matchReason,
        });
      }
    }

    if (candidates.length > 0) {
      return {
        status: "review",
        screenedName,
        screenedAt,
        source: SOURCE_NAME,
        message:
          "Possible sanctions-list match found. Further investigation is required before continuing.",
        candidates: candidates.slice(0, 10),
      };
    }

    return {
      status: "clear",
      screenedName,
      screenedAt,
      source: SOURCE_NAME,
      message: "No potential matches found in the sample sanctions database.",
      candidates: [],
    };
  } catch (error) {
    console.error("Sanctions screening failed:", error);

    return {
      status: "error",
      screenedName,
      screenedAt,
      source: SOURCE_NAME,
      message:
        "Screening could not be completed. The application must be held until screening is available.",
      candidates: [],
    };
  }
}

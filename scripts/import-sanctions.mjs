import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { XMLParser } from "fast-xml-parser";
import { createClient } from "@supabase/supabase-js";

// Load .env.local from the project root
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");

config({
  path: resolve(projectRoot, ".env.local"),
});

const xmlPath = "data/sanctions-list.xml";
const batchSize = 100;

// 1. Check environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
}

// 2. Create a server-side Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// 3. Read and parse the XML file
console.log("Reading sanctions XML file...");

const xml = await readFile(xmlPath, "utf8");

const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
});

const parsed = parser.parse(xml);
const dataset = parsed.NewDataSet;

if (!dataset) {
  throw new Error("Could not find NewDataSet in the XML file.");
}

// 4. Convert XML records into arrays
function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getStrings(value) {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value.flatMap(getStrings);
  }

  if (typeof value === "object") {
    return Object.values(value).flatMap(getStrings);
  }

  return String(value).trim() ? [String(value).trim()] : [];
}

function firstString(value) {
  return getStrings(value)[0] ?? "";
}

// 5. Convert each XML record into a Supabase row
function buildEntry(record, entryType) {
  const primaryName =
    firstString(record.FullName) || firstString(record.FirstName);

  const nameFields =
    entryType === "individual"
      ? [record.FullName, record.IndividualAlias]
      : [record.FirstName, record.EntityAlias];

  const searchText = [
    ...new Set(
      nameFields
        .flatMap(getStrings)
        .map((name) => name.replace(/\s+/g, " ").trim())
        .filter(Boolean),
    ),
  ].join(" ");

  const referenceNumber = firstString(record.ReferenceNumber);

  if (!primaryName || !referenceNumber) {
    throw new Error(
      `A ${entryType} record is missing its name or reference number.`,
    );
  }

  return {
    source_name: "UN Security Council Consolidated Sanctions List",
    entry_type: entryType,
    reference_number: referenceNumber,
    primary_name: primaryName,
    search_text: searchText || primaryName,
    raw_data: record,
  };
}

// 6. Extract individuals and entities
const individuals = asArray(dataset.Table).map((record) =>
  buildEntry(record, "individual"),
);

const entities = asArray(dataset.Table1).map((record) =>
  buildEntry(record, "entity"),
);

const entries = [...individuals, ...entities];

console.log(`Individuals found: ${individuals.length}`);
console.log(`Entities found: ${entities.length}`);
console.log(`Total records found: ${entries.length}`);

// 7. Import records in batches
console.log("Starting Supabase import...");

for (let i = 0; i < entries.length; i += batchSize) {
  const batch = entries.slice(i, i + batchSize);

  const { error } = await supabase.from("sanctions_entries").upsert(batch, {
    onConflict: "entry_type,reference_number",
  });

  if (error) {
    throw new Error(`Import failed at record ${i + 1}: ${error.message}`);
  }

  console.log(
    `Imported ${Math.min(i + batch.length, entries.length)} / ${entries.length}`,
  );
}

console.log("Import completed successfully!");

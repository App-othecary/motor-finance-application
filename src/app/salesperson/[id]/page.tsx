import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ScreeningCandidate = {
  name: string;
  referenceNumber: string;
  entryType: string;
  source: string;
  matchReason: string;
};

type ScreeningStatus =
  | "pending"
  | "clear"
  | "review"
  | "error"
  | "confirmed_match";

async function ApplicationDetails({ params }: PageProps) {
  const { id } = await params;

  // Check that the supplied reference is a UUID.
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  // Retrieve the matching application from Supabase.
  const { data: application, error } = await supabaseAdmin
    .from("applications")
    .select(
      "id, title, full_names, surname, id_number, email, cellphone, created_at, screening_status, screening_message, screening_source, screened_at, screening_candidates",
    )
    .eq("id", id)
    .single();

  if (error || !application) {
    notFound();
  }

  const screeningStatus =
    (application.screening_status as ScreeningStatus) ?? "pending";

  const candidates =
    (application.screening_candidates as ScreeningCandidate[] | null) ?? [];

  // Define the appearance of each screening result.
  const screeningStyles = {
    clear: {
      container: "border-green-200 bg-green-50",
      badge: "bg-green-100 text-green-800",
      heading: "Screening Clear",
      headingColor: "text-green-800",
    },
    review: {
      container: "border-yellow-300 bg-yellow-50",
      badge: "bg-yellow-100 text-yellow-800",
      heading: "Potential Match — Review Required",
      headingColor: "text-yellow-900",
    },
    error: {
      container: "border-amber-300 bg-amber-50",
      badge: "bg-amber-100 text-amber-800",
      heading: "Screening Unavailable",
      headingColor: "text-amber-900",
    },
    confirmed_match: {
      container: "border-red-300 bg-red-50",
      badge: "bg-red-100 text-red-800",
      heading: "Confirmed Match — Stop",
      headingColor: "text-red-900",
    },
    pending: {
      container: "border-slate-300 bg-slate-50",
      badge: "bg-slate-100 text-slate-800",
      heading: "Screening Pending",
      headingColor: "text-slate-800",
    },
  } as const;

  const style = screeningStyles[screeningStatus] ?? screeningStyles.pending;

  const canProceed = screeningStatus === "clear";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-700">
            Salesperson Portal
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Customer Application
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review the information submitted by the customer.
          </p>
        </header>

        {/* Application information */}
        <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 border-b border-slate-200 pb-5">
            <p className="text-sm text-slate-500">Application reference</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
              {application.id}
            </p>
          </div>

          <h2 className="mb-5 text-xl font-semibold text-slate-900">
            Personal Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Title</p>
              <p className="font-medium text-slate-900">{application.title}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Full names</p>
              <p className="font-medium text-slate-900">
                {application.full_names}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Surname</p>
              <p className="font-medium text-slate-900">
                {application.surname}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">ID number</p>
              <p className="font-medium text-slate-900">
                {application.id_number}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Email address</p>
              <p className="break-all font-medium text-slate-900">
                {application.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Cellphone number</p>
              <p className="font-medium text-slate-900">
                {application.cellphone}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-5">
            <p className="text-xs text-slate-500">Submitted on</p>
            <p className="mt-1 text-sm text-slate-700">
              {new Date(application.created_at).toLocaleString("en-ZA", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Africa/Johannesburg",
              })}
            </p>
          </div>
        </section>

        {/* Sanctions screening panel */}
        <section
          className={`mt-6 rounded-xl border p-6 shadow-sm sm:p-8 ${style.container}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className={`text-xl font-bold ${style.headingColor}`}>
              Sanctions Screening
            </h2>

            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${style.badge}`}
            >
              {screeningStatus.replace("_", " ").toUpperCase()}
            </span>
          </div>

          <h3 className={`mt-4 text-lg font-semibold ${style.headingColor}`}>
            {style.heading}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-700">
            {application.screening_message ||
              "No screening result has been recorded for this application."}
          </p>

          <div className="mt-5 grid gap-3 border-t border-black/10 pt-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Screening source
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {application.screening_source || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Screened on
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {application.screened_at
                  ? new Date(application.screened_at).toLocaleString("en-ZA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Africa/Johannesburg",
                    })
                  : "Not screened"}
              </p>
            </div>
          </div>

          {/* Potential match details */}
          {candidates.length > 0 && (
            <div className="mt-6 border-t border-black/10 pt-5">
              <h3 className="mb-4 font-semibold text-slate-900">
                Potential Matches ({candidates.length})
              </h3>

              <div className="space-y-4">
                {candidates.map((candidate, index) => (
                  <div
                    key={`${candidate.referenceNumber}-${index}`}
                    className="rounded-lg border border-yellow-300 bg-white p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {candidate.name}
                    </p>

                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      <p>
                        <span className="font-medium">Reference:</span>{" "}
                        {candidate.referenceNumber}
                      </p>

                      <p>
                        <span className="font-medium">Type:</span>{" "}
                        {candidate.entryType}
                      </p>

                      <p>
                        <span className="font-medium">Match reason:</span>{" "}
                        {candidate.matchReason}
                      </p>

                      <p>
                        <span className="font-medium">Source:</span>{" "}
                        {candidate.source}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm font-medium text-yellow-900">
                Do not proceed with this application until the potential match
                has been investigated and resolved.
              </p>
            </div>
          )}

          {/* Decision message */}
          <div className="mt-6 rounded-lg border border-black/10 bg-white/70 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Application progression
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {canProceed
                ? "Screening has returned clear. The application may proceed to the next stage."
                : screeningStatus === "confirmed_match"
                  ? "A confirmed match is recorded. Stop processing and escalate according to compliance procedures."
                  : "The application is on hold. It cannot proceed until screening is resolved."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SalespersonPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 px-4 py-10">
          <div className="mx-auto max-w-3xl rounded-xl bg-white p-8">
            Loading customer application...
          </div>
        </main>
      }
    >
      <ApplicationDetails params={params} />
    </Suspense>
  );
}

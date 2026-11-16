import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function SalespersonDashboard() {
  const { data: applications, error } = await supabaseAdmin
    .from("applications")
    .select("id, title, full_names, surname, email, created_at, status")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Dashboard retrieval error:", error.message);

    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl rounded-xl bg-white p-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Unable to load applications
          </h1>
          <p className="mt-2 text-slate-600">Please try again later.</p>
        </div>
      </main>
    );
  }

  const totalApplications = applications.length;

  const receivedApplications = applications.filter(
    (application) => application.status === "Received",
  ).length;

  const statusStyles: Record<string, string> = {
    Received: "bg-blue-100 text-blue-800",
    "In review": "bg-amber-100 text-amber-800",
    Approved: "bg-green-100 text-green-800",
    Declined: "bg-red-100 text-red-800",
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-700">
            Motor Finance Application
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Salesperson Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            View and manage customer applications.
          </p>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total applications</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalApplications}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Awaiting review</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {receivedApplications}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Customer Applications
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Most recently submitted applications appear first.
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-700">
                No applications have been submitted yet.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                New customer applications will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {applications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">
                      {application.title} {application.full_names}{" "}
                      {application.surname}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {application.email}
                    </p>

                    <p className="mt-2 break-all font-mono text-xs text-slate-400">
                      Reference: {application.id}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Submitted:{" "}
                      {new Date(application.created_at).toLocaleDateString(
                        "en-ZA",
                        {
                          dateStyle: "medium",
                          timeZone: "Africa/Johannesburg",
                        },
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[application.status] ??
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {application.status}
                    </span>

                    <Link
                      href={`/salesperson/${application.id}`}
                      className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                    >
                      View application
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

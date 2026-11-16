export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SalespersonPage({ params }: PageProps) {
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
      "id, title, full_names, surname, id_number, email, cellphone, created_at",
    )
    .eq("id", id)
    .single();

  if (error || !application) {
    notFound();
  }

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
      </div>
    </main>
  );
}

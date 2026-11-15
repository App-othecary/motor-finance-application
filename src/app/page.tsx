"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("Submitting your application...");

    const formData = new FormData(event.currentTarget);

    const application = {
      title: formData.get("title"),
      fullNames: formData.get("fullNames"),
      surname: formData.get("surname"),
      idNumber: formData.get("idNumber"),
      email: formData.get("email"),
      cellphone: formData.get("cellphone"),
    };

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(application),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Unable to submit your application.");
        return;
      }

      setMessage(
        `Application saved successfully. Reference: ${result.applicationId}`,
      );
    } catch {
      setMessage("Unable to connect to the server. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm sm:p-10">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-700">
            Customer Application
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Motor Finance Application
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Please complete your personal information below.
          </p>
        </header>

        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-slate-700">
              Step 1: Personal Information
            </span>
            <span className="text-slate-500">1 of 8</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-[12.5%] rounded-full bg-blue-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Title *
            </label>

            <select
              id="title"
              name="title"
              required
              defaultValue=""
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="" disabled>
                Select title
              </option>
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Ms">Ms</option>
              <option value="Miss">Miss</option>
              <option value="Dr">Dr</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="fullNames"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Full names *
            </label>

            <input
              type="text"
              id="fullNames"
              name="fullNames"
              required
              autoComplete="given-name"
              placeholder="Enter your full names"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="surname"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Surname *
            </label>

            <input
              type="text"
              id="surname"
              name="surname"
              required
              autoComplete="family-name"
              placeholder="Enter your surname"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="idNumber"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              South African ID number *
            </label>

            <input
              type="text"
              id="idNumber"
              name="idNumber"
              required
              inputMode="numeric"
              maxLength={13}
              minLength={13}
              pattern="[0-9]{13}"
              placeholder="Enter your 13-digit ID number"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-xs text-slate-500">
              Please enter all 13 digits without spaces.
            </p>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address *
            </label>

            <input
              type="email"
              id="email"
              name="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="cellphone"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Cellphone number *
            </label>

            <input
              type="tel"
              id="cellphone"
              name="cellphone"
              required
              autoComplete="tel"
              placeholder="082 000 0000"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Validate personal information
            </button>
          </div>

          {message && (
            <p
              role="status"
              className="rounded-lg bg-green-50 p-4 text-sm text-green-800"
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

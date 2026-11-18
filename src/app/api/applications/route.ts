import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { screenIndividual } from "@/lib/sanctions-screening";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { title, fullNames, surname, idNumber, email, cellphone } = body;

    // Basic server-side validation
    if (
      !title ||
      !fullNames ||
      !surname ||
      !/^\d{13}$/.test(idNumber || "") ||
      !email ||
      !cellphone
    ) {
      return NextResponse.json(
        { error: "Please provide valid application details." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase server configuration is missing.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Screen the applicant before saving the application.
    const screening = await screenIndividual(fullNames, surname);

    // Save application and screening result together.
    const { data, error } = await supabase
      .from("applications")
      .insert({
        title,
        full_names: fullNames,
        surname,
        id_number: idNumber,
        email,
        cellphone,

        screening_status: screening.status,
        screening_message: screening.message,
        screening_source: screening.source,
        screened_at: screening.screenedAt,
        screening_candidates: screening.candidates,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error.message);

      return NextResponse.json(
        { error: "Unable to save your application." },
        { status: 500 },
      );
    }

    // Screening errors and possible matches are saved, but not cleared.
    const canProceed = screening.status === "clear";

    return NextResponse.json(
      {
        message: "Application saved successfully.",
        applicationId: data.id,
        screening: {
          status: screening.status,
          message: screening.message,
          source: screening.source,
          screenedAt: screening.screenedAt,
          candidates: screening.candidates,
        },
        canProceed,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Application submission error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

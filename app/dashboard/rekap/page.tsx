import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RekapClient from "./RekapClient";

type Block = {
  id: string;
  code: string;
  name: string;
};

type Member = {
  id: string;
  code: string | null;
  name: string;
  block_id: string;
};

type Offering = {
  id: string;
  member_id: string;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string | null;
};

export default async function RekapPage() {
  const supabase = await createClient();

  // =========================
  // CEK LOGIN
  // =========================
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // =========================
  // AMBIL DATA BLOK
  // =========================
  const { data: blocks, error: blocksError } = await supabase
    .from("blocks")
    .select("id, code, name")
    .order("code", { ascending: true });

  if (blocksError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rekap Persembahan</h1>

        <p className="mt-4 text-red-600">
          Gagal mengambil data blok: {blocksError.message}
        </p>
      </div>
    );
  }

  // =========================
  // AMBIL DATA JEMAAT
  // =========================
  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("id, code, name, block_id")
    .order("name", { ascending: true });

  if (membersError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rekap Persembahan</h1>

        <p className="mt-4 text-red-600">
          Gagal mengambil data jemaat: {membersError.message}
        </p>
      </div>
    );
  }

  // =========================
  // AMBIL DATA PERSEMBAHAN
  // =========================
  const { data: offerings, error: offeringsError } = await supabase
    .from("offerings")
    .select("id, member_id, amount, date, note, created_at, updated_at")
    .order("date", { ascending: false });

  if (offeringsError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rekap Persembahan</h1>

        <p className="mt-4 text-red-600">
          Gagal mengambil data persembahan: {offeringsError.message}
        </p>
      </div>
    );
  }

  // =========================
  // KIRIM DATA KE CLIENT
  // =========================
  return (
    <RekapClient
      members={(members ?? []) as Member[]}
      blocks={(blocks ?? []) as Block[]}
      offerings={(offerings ?? []) as Offering[]}
    />
  );
}

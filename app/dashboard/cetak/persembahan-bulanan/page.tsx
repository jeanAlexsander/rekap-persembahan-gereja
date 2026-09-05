import { createClient } from "@/lib/supabase/server";
import CetakPersembahanBulananClient from "./CetakPersembahanBulananClient";

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

export default async function CetakPersembahanBulananPage() {
  const supabase = await createClient();

  const [
    { data: blocks, error: blocksError },
    { data: members, error: membersError },
    { data: offerings, error: offeringsError },
  ] = await Promise.all([
    supabase.from("blocks").select("id, code, name").order("code"),

    supabase.from("members").select("id, code, name, block_id").order("code"),

    supabase
      .from("offerings")
      .select("id, member_id, amount, date, note, created_at, updated_at")
      .order("date", { ascending: true }),
  ]);

  if (blocksError) {
    console.error("Gagal mengambil data blok:", blocksError);
  }

  if (membersError) {
    console.error("Gagal mengambil data jemaat:", membersError);
  }

  if (offeringsError) {
    console.error("Gagal mengambil data persembahan:", offeringsError);
  }

  return (
    <CetakPersembahanBulananClient
      blocks={(blocks ?? []) as Block[]}
      members={(members ?? []) as Member[]}
      offerings={(offerings ?? []) as Offering[]}
    />
  );
}

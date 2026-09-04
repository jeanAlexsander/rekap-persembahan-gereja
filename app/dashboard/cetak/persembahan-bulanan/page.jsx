import { createClient } from "@/lib/supabase/server";
import CetakPersembahanBulananClient from "./CetakPersembahanBulananClient";

export default async function CetakPersembahanBulananPage() {
  const supabase = await createClient();

  const [
    { data: blocks, error: blocksError },
    { data: members, error: membersError },
    { data: offerings, error: offeringsError },
  ] = await Promise.all([
    supabase.from("blocks").select("id, code, name").order("code"),

    supabase.from("members").select("id, name, block_id").order("name"),

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
      blocks={blocks ?? []}
      members={members ?? []}
      offerings={offerings ?? []}
    />
  );
}

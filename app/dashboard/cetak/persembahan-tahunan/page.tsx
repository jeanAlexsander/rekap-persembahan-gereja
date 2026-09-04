import { createClient } from "@/lib/supabase/server";
import CetakPersembahanTahunanClient from "./CetakPersembahanTahunanClient";

export default async function CetakPersembahanTahunanPage() {
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
      .select("id, member_id, amount, date")
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
    <CetakPersembahanTahunanClient
      blocks={blocks ?? []}
      members={members ?? []}
      offerings={offerings ?? []}
    />
  );
}

import { createClient } from "@/lib/supabase/server";
import BlokClient from "./BlokClient";

export default async function BlokPage() {
  const supabase = await createClient();

  const [
    { data: blocks, error: blocksError },
    { data: members, error: membersError },
  ] = await Promise.all([
    supabase
      .from("blocks")
      .select("id, code, name")
      .order("code"),

    supabase
      .from("members")
      .select("id, block_id"),
  ]);

  if (blocksError) {
    console.error("Gagal mengambil data blok:", blocksError);
  }

  if (membersError) {
    console.error("Gagal mengambil data jemaat:", membersError);
  }

  return (
    <BlokClient
      initialBlocks={blocks ?? []}
      initialMembers={members ?? []}
    />
  );
}

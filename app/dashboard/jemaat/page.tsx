import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JemaatClient from "./JemaatClient";

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
  created_at: string;
  blocks: Block[] | null;
};

export default async function JemaatPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("USER:", user);
  console.log("AUTH ERROR:", authError);
  console.log("USER ROLE:", user?.role);

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
        <h1 className="text-2xl font-bold text-gray-900">Data Jemaat</h1>

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
    .select(
      `
      id,
      code,
      name,
      block_id,
      created_at
    `,
    )
    .order("name", { ascending: true });

  if (membersError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Jemaat</h1>

        <p className="mt-4 text-red-600">
          Gagal mengambil data jemaat: {membersError.message}
        </p>
      </div>
    );
  }

  // =========================
  // GABUNGKAN JEMAAT + BLOK
  // =========================
  const formattedMembers: Member[] = (members ?? []).map((member) => {
    const block = (blocks ?? []).find((block) => block.id === member.block_id);

    return {
      id: member.id,
      code: member.code,
      name: member.name,
      block_id: member.block_id,
      created_at: member.created_at,
      blocks: block ? [block] : [],
    };
  });

  return (
    <JemaatClient initialMembers={formattedMembers} blocks={blocks ?? []} />
  );
}

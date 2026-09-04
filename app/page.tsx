import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data: blocks, error } = await supabase
    .from("blocks")
    .select("*")
    .order("id");

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="mt-2">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Test Supabase</h1>

      <div className="mt-6 space-y-2">
        {blocks?.map((block) => (
          <div key={block.id}>
            {block.code} - {block.name}
          </div>
        ))}
      </div>
    </main>
  );
}

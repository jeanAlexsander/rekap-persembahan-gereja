import { redirect } from "next/navigation";
import {
  Users,
  HandCoins,
  ReceiptText,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Block = {
  id: string;
  code: string;
  name: string;
};

type Member = {
  id: string;
  name: string;
  block_id: string;
};

type Offering = {
  id: string;
  member_id: string;
  amount: number;
  date: string;
  note: string | null;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getCurrentIndonesiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // =========================
  // AUTH
  // =========================
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // =========================
  // TANGGAL SEKARANG
  // =========================
  const currentDate = getCurrentIndonesiaDate();

  const currentYear = Number(currentDate.slice(0, 4));
  const currentMonth = Number(currentDate.slice(5, 7));

  // =========================
  // AMBIL DATA BLOCK
  // =========================
  const { data: blocks, error: blocksError } = await supabase
    .from("blocks")
    .select("id, code, name")
    .order("code", { ascending: true });

  if (blocksError) {
    return (
      <main className="p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Gagal mengambil data blok: {blocksError.message}
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // AMBIL DATA JEMAAT
  // =========================
  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("id, name, block_id");

  if (membersError) {
    return (
      <main className="p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Gagal mengambil data jemaat: {membersError.message}
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // AMBIL DATA PERSEMBAHAN
  // =========================
  const { data: offerings, error: offeringsError } = await supabase
    .from("offerings")
    .select("id, member_id, amount, date, note")
    .order("date", { ascending: false });

  if (offeringsError) {
    return (
      <main className="p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Gagal mengambil data persembahan: {offeringsError.message}
          </div>
        </div>
      </main>
    );
  }

  const blockList = (blocks ?? []) as Block[];
  const memberList = (members ?? []) as Member[];
  const offeringList = (offerings ?? []) as Offering[];

  // =========================
  // PERSEMBAHAN BULAN INI
  // =========================
  const monthlyOfferings = offeringList.filter((offering) => {
    const year = Number(offering.date.slice(0, 4));
    const month = Number(offering.date.slice(5, 7));

    return year === currentYear && month === currentMonth;
  });

  const monthlyTotal = monthlyOfferings.reduce(
    (total, offering) => total + Number(offering.amount),
    0,
  );

  // =========================
  // PERSEMBAHAN TAHUN INI
  // =========================
  const yearlyOfferings = offeringList.filter((offering) => {
    const year = Number(offering.date.slice(0, 4));

    return year === currentYear;
  });

  const yearlyTotal = yearlyOfferings.reduce(
    (total, offering) => total + Number(offering.amount),
    0,
  );

  // =========================
  // TRANSAKSI BULAN INI
  // =========================
  const monthlyTransactions = monthlyOfferings.length;

  // =========================
  // NAMA BULAN
  // =========================
  const currentMonthName = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  // =========================
  // PERSEMBAHAN PER BLOK
  // =========================
  const blockSummaries = blockList.map((block) => {
    const blockMemberIds = memberList
      .filter((member) => member.block_id === block.id)
      .map((member) => member.id);

    const blockOfferings = yearlyOfferings.filter((offering) =>
      blockMemberIds.includes(offering.member_id),
    );

    const total = blockOfferings.reduce(
      (sum, offering) => sum + Number(offering.amount),
      0,
    );

    const transactions = blockOfferings.length;

    return {
      ...block,
      total,
      transactions,
    };
  });

  // =========================
  // 5 TRANSAKSI TERBARU
  // =========================
  const latestOfferings = offeringList.slice(0, 5);

  return (
    <main className="p-8">
      <div className="mx-auto max-w-7xl">
        {/* =========================
            HEADER
        ========================= */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

          <p className="mt-2 text-gray-500">Selamat datang, {user.email}</p>
        </div>

        {/* =========================
            SUMMARY CARDS
        ========================= */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* PERSEMBAHAN BULAN INI */}
          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Persembahan Bulan Ini
                </p>

                <p className="mt-3 text-2xl font-bold text-gray-900">
                  {formatRupiah(monthlyTotal)}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  {currentMonthName} {currentYear}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                <HandCoins size={21} />
              </div>
            </div>
          </div>

          {/* TOTAL TAHUN INI */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Tahun Ini
                </p>

                <p className="mt-3 text-2xl font-bold text-gray-900">
                  {formatRupiah(yearlyTotal)}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Januari - Desember {currentYear}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <TrendingUp size={21} />
              </div>
            </div>
          </div>

          {/* TOTAL JEMAAT */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Jemaat
                </p>

                <p className="mt-3 text-2xl font-bold text-gray-900">
                  {memberList.length}
                </p>

                <p className="mt-2 text-xs text-gray-500">Jemaat terdaftar</p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <Users size={21} />
              </div>
            </div>
          </div>

          {/* TRANSAKSI BULAN INI */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Transaksi Bulan Ini
                </p>

                <p className="mt-3 text-2xl font-bold text-gray-900">
                  {monthlyTransactions}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Transaksi persembahan
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <ReceiptText size={21} />
              </div>
            </div>
          </div>
        </div>

        {/* =========================
            RINGKASAN PER BLOK
        ========================= */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Persembahan per Blok
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Ringkasan persembahan tahun {currentYear}.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blockSummaries.map((block) => (
              <div
                key={block.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-600">
                        {block.code}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">
                          Blok {block.code}
                        </p>

                        <p className="text-xs text-gray-500">{block.name}</p>
                      </div>
                    </div>
                  </div>

                  <ArrowUpRight size={18} className="text-gray-400" />
                </div>

                <div className="mt-5">
                  <p className="text-xs font-medium text-gray-500">
                    Total Persembahan
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatRupiah(block.total)}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    {block.transactions} transaksi
                  </p>
                </div>
              </div>
            ))}

            {blockSummaries.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                Belum ada data blok.
              </div>
            )}
          </div>
        </div>

        {/* =========================
            TRANSAKSI TERBARU
        ========================= */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-bold text-gray-900">
              Persembahan Terbaru
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              5 transaksi persembahan terakhir.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Jemaat
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Blok
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Nominal
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Tanggal
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Catatan
                  </th>
                </tr>
              </thead>

              <tbody>
                {latestOfferings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Belum ada data persembahan.
                    </td>
                  </tr>
                ) : (
                  latestOfferings.map((offering) => {
                    const member = memberList.find(
                      (member) => member.id === offering.member_id,
                    );

                    const block = blockList.find(
                      (block) => block.id === member?.block_id,
                    );

                    return (
                      <tr
                        key={offering.id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {member?.name ?? "-"}
                        </td>

                        <td className="px-6 py-4">
                          {block ? (
                            <div>
                              <p className="font-medium text-gray-900">
                                {block.code}
                              </p>

                              <p className="text-xs text-gray-500">
                                {block.name}
                              </p>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {formatRupiah(Number(offering.amount))}
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {formatDate(offering.date)}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {offering.note || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

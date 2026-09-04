"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, HandCoins, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

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
  created_at: string;
  updated_at: string | null;
};

interface Props {
  members: Member[];
  blocks: Block[];
  offerings: Offering[];
}

const months = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

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

export default function CetakPersembahanBulananClient({
  members,
  blocks,
  offerings,
}: Props) {
  const router = useRouter();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));

  const [selectedBlock, setSelectedBlock] = useState("all");

  const years = useMemo(() => {
    return Array.from(
      new Set([
        currentYear,
        ...offerings.map((offering) => Number(offering.date.slice(0, 4))),
      ]),
    ).sort((a, b) => b - a);
  }, [offerings, currentYear]);

  const reportData = useMemo(() => {
    const filteredOfferings = offerings.filter((offering) => {
      const year = Number(offering.date.slice(0, 4));
      const month = Number(offering.date.slice(5, 7));

      const member = members.find((member) => member.id === offering.member_id);

      if (!member) return false;

      const matchYear = year === Number(selectedYear);

      const matchMonth = month === Number(selectedMonth);

      const matchBlock =
        selectedBlock === "all" ||
        String(member.block_id) === String(selectedBlock);

      return matchYear && matchMonth && matchBlock;
    });

    const grouped = new Map<
      string,
      {
        member: Member;
        block: Block | undefined;
        total: number;
        transactions: number;
        lastDate: string;
      }
    >();

    filteredOfferings.forEach((offering) => {
      const member = members.find((member) => member.id === offering.member_id);

      if (!member) return;

      const block = blocks.find((block) => block.id === member.block_id);

      const existing = grouped.get(member.id);

      if (existing) {
        existing.total += Number(offering.amount);
        existing.transactions += 1;

        if (offering.date > existing.lastDate) {
          existing.lastDate = offering.date;
        }
      } else {
        grouped.set(member.id, {
          member,
          block,
          total: Number(offering.amount),
          transactions: 1,
          lastDate: offering.date,
        });
      }
    });

    const order = ["A", "B", "C", "D", "E", "SK"];

    return Array.from(grouped.values()).sort((a, b) => {
      const indexA = order.indexOf(a.block?.code ?? "");
      const indexB = order.indexOf(b.block?.code ?? "");

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      return a.member.name.localeCompare(b.member.name);
    });
  }, [offerings, members, blocks, selectedYear, selectedMonth, selectedBlock]);

  const totalAmount = reportData.reduce((total, item) => total + item.total, 0);

  const totalTransactions = reportData.reduce(
    (total, item) => total + item.transactions,
    0,
  );

  const selectedMonthLabel =
    months.find((month) => month.value === selectedMonth)?.label ?? "";

  const selectedBlockLabel =
    selectedBlock === "all"
      ? "Semua Blok"
      : (() => {
          const block = blocks.find((item) => item.id === selectedBlock);

          return block ? `${block.code} - ${block.name}` : "Semua Blok";
        })();

  return (
    <>
      {/* AREA APLIKASI - TIDAK IKUT PRINT */}
      <div className="space-y-6 print:hidden">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
              title="Kembali"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Printer size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cetak Rekap Persembahan
              </h1>

              <p className="text-sm text-gray-500">
                Pilih periode dan blok untuk membuat laporan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            <Printer size={18} />
            Cetak Laporan
          </button>
        </div>

        {/* FILTER */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            {/* TAHUN */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tahun
              </label>

              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  opacity: 1,
                }}
              >
                {years.map((year) => (
                  <option
                    key={year}
                    value={year}
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#111827",
                    }}
                  >
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* BULAN */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bulan
              </label>

              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  opacity: 1,
                }}
              >
                {months.map((month) => (
                  <option
                    key={month.value}
                    value={month.value}
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#111827",
                    }}
                  >
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* BLOK */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Blok
              </label>

              <select
                value={selectedBlock}
                onChange={(event) => setSelectedBlock(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  opacity: 1,
                }}
              >
                <option
                  value="all"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#111827",
                  }}
                >
                  Semua Blok
                </option>

                {blocks.map((block) => (
                  <option
                    key={block.id}
                    value={block.id}
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#111827",
                    }}
                  >
                    {block.code} - {block.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* PREVIEW */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <CalendarDays size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">Preview Laporan</h2>

                <p className="text-sm text-gray-500">
                  {selectedMonthLabel} {selectedYear} · {selectedBlockLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    No
                  </th>

                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Nama Jemaat
                  </th>

                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    Blok
                  </th>

                  <th className="px-5 py-3 text-center font-semibold text-gray-600">
                    Transaksi
                  </th>

                  <th className="px-5 py-3 text-center font-semibold text-gray-600">
                    Tanggal
                  </th>

                  <th className="px-5 py-3 text-right font-semibold text-gray-600">
                    Total Persembahan
                  </th>
                </tr>
              </thead>

              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      Tidak ada data persembahan untuk periode dan blok yang
                      dipilih.
                    </td>
                  </tr>
                ) : (
                  reportData.map((item, index) => (
                    <tr
                      key={item.member.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-5 py-4 text-gray-500">{index + 1}</td>

                      <td className="px-5 py-4 font-medium text-gray-900">
                        {item.member.name}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {item.block?.code ?? "-"}{" "}
                        <span className="text-gray-400">
                          - {item.block?.name ?? "-"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center text-gray-600">
                        {item.transactions}
                      </td>

                      <td className="px-5 py-4 text-center text-gray-600">
                        {formatDate(item.lastDate)}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-gray-900">
                        {formatRupiah(item.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {reportData.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-4 text-right font-bold text-gray-700"
                    >
                      TOTAL
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-orange-600">
                      {formatRupiah(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <HandCoins size={19} />
              </div>

              <div>
                <p className="text-sm text-gray-500">Total Persembahan</p>

                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatRupiah(totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <CalendarDays size={19} />
              </div>

              <div>
                <p className="text-sm text-gray-500">Jumlah Transaksi</p>

                <p className="mt-1 text-xl font-bold text-gray-900">
                  {totalTransactions}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* PRINT AREA */}
      {/* ============================= */}

      <div className="hidden print:block">
        <div className="p-8 text-black">
          {/* JUDUL */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">GKJ</h1>

            <h2 className="mt-1 text-xl font-bold">REKAP PERSEMBAHAN</h2>

            <p className="mt-1 text-sm">
              {selectedMonthLabel} {selectedYear}
            </p>

            <p className="text-sm">{selectedBlockLabel}</p>
          </div>

          {/* TABLE PRINT */}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-black px-3 py-2 text-left">No</th>

                <th className="border border-black px-3 py-2 text-left">
                  Nama Jemaat
                </th>

                <th className="border border-black px-3 py-2 text-left">
                  Blok
                </th>

                <th className="border border-black px-3 py-2 text-center">
                  Transaksi
                </th>

                <th className="border border-black px-3 py-2 text-center">
                  Tanggal
                </th>

                <th className="border border-black px-3 py-2 text-right">
                  Total Persembahan
                </th>
              </tr>
            </thead>

            <tbody>
              {reportData.map((item, index) => (
                <tr key={item.member.id}>
                  <td className="border border-black px-3 py-2">{index + 1}</td>

                  <td className="border border-black px-3 py-2">
                    {item.member.name}
                  </td>

                  <td className="border border-black px-3 py-2">
                    {item.block?.code ?? "-"} - {item.block?.name ?? "-"}
                  </td>

                  <td className="border border-black px-3 py-2 text-center">
                    {item.transactions}
                  </td>

                  <td className="border border-black px-3 py-2 text-center">
                    {formatDate(item.lastDate)}
                  </td>

                  <td className="border border-black px-3 py-2 text-right">
                    {formatRupiah(item.total)}
                  </td>
                </tr>
              ))}

              {reportData.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="border border-black px-3 py-5 text-center"
                  >
                    Tidak ada data persembahan.
                  </td>
                </tr>
              )}
            </tbody>

            <tfoot>
              <tr>
                <td
                  colSpan={5}
                  className="border border-black px-3 py-2 text-right font-bold"
                >
                  TOTAL
                </td>

                <td className="border border-black px-3 py-2 text-right font-bold">
                  {formatRupiah(totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* FOOTER */}
          <div className="mt-10 flex justify-end">
            <div className="w-56 text-center">
              <p className="text-sm">Dicetak pada:</p>

              <p className="text-sm">
                {new Intl.DateTimeFormat("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }).format(new Date())}
              </p>

              <div className="h-20" />

              <p className="text-sm font-semibold">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT STYLE */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }

          html,
          body {
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
}

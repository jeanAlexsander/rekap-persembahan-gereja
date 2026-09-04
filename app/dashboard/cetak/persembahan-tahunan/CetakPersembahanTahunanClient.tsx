"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, HandCoins, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

interface Block {
  id: string;
  code: string;
  name: string;
}

interface Member {
  id: string;
  name: string;
  block_id: string;
}

interface Offering {
  id: string;
  member_id: string;
  amount: number;
  date: string;
}

interface Props {
  blocks: Block[];
  members: Member[];
  offerings: Offering[];
}

const months = [
  { value: 1, name: "Januari" },
  { value: 2, name: "Februari" },
  { value: 3, name: "Maret" },
  { value: 4, name: "April" },
  { value: 5, name: "Mei" },
  { value: 6, name: "Juni" },
  { value: 7, name: "Juli" },
  { value: 8, name: "Agustus" },
  { value: 9, name: "September" },
  { value: 10, name: "Oktober" },
  { value: 11, name: "November" },
  { value: 12, name: "Desember" },
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPrintDate() {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function CetakPersembahanTahunanClient({
  blocks,
  members,
  offerings,
}: Props) {
  const router = useRouter();

  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedBlock, setSelectedBlock] = useState("all");

  // ==========================================
  // MAPPING MEMBER -> BLOCK
  // ==========================================

  const memberBlockMap = useMemo(() => {
    const map = new Map<string, string>();

    members.forEach((member) => {
      map.set(member.id, member.block_id);
    });

    return map;
  }, [members]);

  // ==========================================
  // DAFTAR TAHUN
  // ==========================================

  const years = useMemo(() => {
    const yearSet = new Set<number>();

    offerings.forEach((offering) => {
      const year = Number(offering.date.substring(0, 4));

      if (!Number.isNaN(year)) {
        yearSet.add(year);
      }
    });

    yearSet.add(currentYear);

    return Array.from(yearSet).sort((a, b) => b - a);
  }, [offerings, currentYear]);

  // ==========================================
  // SORT BLOK
  // ==========================================

  const sortedBlocks = useMemo(() => {
    const order = ["A", "B", "C", "D", "E", "SK"];

    return [...blocks].sort((a, b) => {
      const indexA = order.indexOf(a.code);
      const indexB = order.indexOf(b.code);

      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [blocks]);

  // ==========================================
  // DATA TAHUN YANG DIPILIH
  // ==========================================

  const yearlyOfferings = useMemo(() => {
    return offerings.filter((offering) => {
      const year = Number(offering.date.substring(0, 4));

      if (year !== selectedYear) {
        return false;
      }

      if (selectedBlock === "all") {
        return true;
      }

      const blockId = memberBlockMap.get(offering.member_id);

      return blockId === selectedBlock;
    });
  }, [offerings, selectedYear, selectedBlock, memberBlockMap]);

  // ==========================================
  // REKAP BULANAN
  // ==========================================

  const monthlyData = useMemo(() => {
    return months.map((month) => {
      const blockTotals: Record<string, number> = {};

      sortedBlocks.forEach((block) => {
        blockTotals[block.id] = 0;
      });

      let total = 0;
      let transactions = 0;

      yearlyOfferings.forEach((offering) => {
        const monthNumber = Number(offering.date.substring(5, 7));

        if (monthNumber !== month.value) {
          return;
        }

        const blockId = memberBlockMap.get(offering.member_id);

        if (!blockId) {
          return;
        }

        const amount = Number(offering.amount);

        blockTotals[blockId] = (blockTotals[blockId] ?? 0) + amount;

        total += amount;
        transactions += 1;
      });

      return {
        month,
        blockTotals,
        total,
        transactions,
      };
    });
  }, [yearlyOfferings, sortedBlocks, memberBlockMap]);

  // ==========================================
  // TOTAL TAHUN
  // ==========================================

  const totalYear = useMemo(() => {
    return monthlyData.reduce((sum, month) => sum + month.total, 0);
  }, [monthlyData]);

  // ==========================================
  // TOTAL TRANSAKSI
  // ==========================================

  const totalTransactions = useMemo(() => {
    return monthlyData.reduce((sum, month) => sum + month.transactions, 0);
  }, [monthlyData]);

  // ==========================================
  // TOTAL PER BLOK
  // ==========================================

  const blockYearTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    sortedBlocks.forEach((block) => {
      totals[block.id] = monthlyData.reduce(
        (sum, month) => sum + (month.blockTotals[block.id] ?? 0),
        0,
      );
    });

    return totals;
  }, [sortedBlocks, monthlyData]);

  // ==========================================
  // PRINT
  // ==========================================

  function handlePrint() {
    window.print();
  }

  const selectedBlockName =
    selectedBlock === "all"
      ? "Semua Blok"
      : `Blok ${
          sortedBlocks.find((block) => block.id === selectedBlock)?.code ?? "-"
        }`;

  return (
    <>
      {/* ================================================= */}
      {/* TAMPILAN DASHBOARD */}
      {/* ================================================= */}

      <div className="print:hidden">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => router.push("/dashboard/cetak")}
              className="mb-3 flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
            >
              <ArrowLeft size={18} />
              Kembali ke Cetak Laporan
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <HandCoins size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Rekap Persembahan Tahunan
                </h1>

                <p className="text-sm text-gray-500">
                  Rekap persembahan berdasarkan tahun dan blok
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            <Printer size={19} />
            Cetak Laporan
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={19} className="text-orange-600" />

            <h2 className="font-semibold text-gray-900">Filter Laporan</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Tahun */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tahun
              </label>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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

            {/* Blok */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Blok
              </label>

              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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

                {sortedBlocks.map((block) => (
                  <option
                    key={block.id}
                    value={block.id}
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#111827",
                    }}
                  >
                    Blok {block.code} - {block.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Persembahan {selectedYear}
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatRupiah(totalYear)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Transaksi</p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalTransactions}
            </p>
          </div>
        </div>

        {/* Total Per Blok */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedBlocks.map((block) => (
            <div
              key={block.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">Blok {block.code}</p>

              <p className="mt-2 text-xl font-bold text-gray-900">
                {formatRupiah(blockYearTotals[block.id] ?? 0)}
              </p>

              <p className="mt-1 text-xs text-gray-400">{block.name}</p>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Preview Laporan</h2>

            <p className="mt-1 text-xs text-gray-500">
              Rekap Januari sampai Desember {selectedYear}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-3 text-center">
                    No
                  </th>

                  <th className="border border-gray-200 px-4 py-3 text-left">
                    Bulan
                  </th>

                  {sortedBlocks.map((block) => (
                    <th
                      key={block.id}
                      className="border border-gray-200 px-4 py-3 text-right"
                    >
                      Blok {block.code}
                    </th>
                  ))}

                  <th className="border border-gray-200 px-4 py-3 text-right">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {monthlyData.map((item, index) => (
                  <tr key={item.month.value}>
                    <td className="border border-gray-200 px-3 py-3 text-center">
                      {index + 1}
                    </td>

                    <td className="border border-gray-200 px-4 py-3 font-medium">
                      {item.month.name}
                    </td>

                    {sortedBlocks.map((block) => (
                      <td
                        key={block.id}
                        className="border border-gray-200 px-4 py-3 text-right"
                      >
                        {formatRupiah(item.blockTotals[block.id] ?? 0)}
                      </td>
                    ))}

                    <td className="border border-gray-200 px-4 py-3 text-right font-semibold">
                      {formatRupiah(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td
                    colSpan={2}
                    className="border border-gray-200 px-4 py-3 text-right"
                  >
                    TOTAL
                  </td>

                  {sortedBlocks.map((block) => (
                    <td
                      key={block.id}
                      className="border border-gray-200 px-4 py-3 text-right"
                    >
                      {formatRupiah(blockYearTotals[block.id] ?? 0)}
                    </td>
                  ))}

                  <td className="border border-gray-200 px-4 py-3 text-right">
                    {formatRupiah(totalYear)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* TAMPILAN KHUSUS PRINT */}
      {/* ================================================= */}

      <div className="hidden print:block">
        <style jsx global>{`
          @page {
            size: A4 landscape;
            margin: 12mm;
          }

          @media print {
            html,
            body {
              margin: 0;
              padding: 0;
              background: white !important;
            }

            * {
              box-shadow: none !important;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th,
            td {
              border: 1px solid #000 !important;
            }
          }
        `}</style>

        <div className="w-full text-black">
          {/* Header */}
          <div className="mb-5 text-center">
            <h1 className="text-xl font-bold tracking-wide">GKJ</h1>

            <h2 className="mt-1 text-lg font-bold">
              REKAP PERSEMBAHAN TAHUNAN
            </h2>

            <p className="mt-1 text-sm">Tahun {selectedYear}</p>

            <div className="mx-auto mt-3 h-px w-full bg-black" />
          </div>

          {/* Keterangan */}
          <div className="mb-4 flex justify-between text-sm">
            <div>
              <strong>{selectedBlockName}</strong>
            </div>

            <div>Dicetak: {formatPrintDate()}</div>
          </div>

          {/* Tabel */}
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr>
                <th className="border border-black px-2 py-2 text-center">
                  No
                </th>

                <th className="border border-black px-3 py-2 text-left">
                  Bulan
                </th>

                {sortedBlocks.map((block) => (
                  <th
                    key={block.id}
                    className="border border-black px-2 py-2 text-right"
                  >
                    Blok {block.code}
                  </th>
                ))}

                <th className="border border-black px-2 py-2 text-right">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {monthlyData.map((item, index) => (
                <tr key={item.month.value}>
                  <td className="border border-black px-2 py-2 text-center">
                    {index + 1}
                  </td>

                  <td className="border border-black px-3 py-2">
                    {item.month.name}
                  </td>

                  {sortedBlocks.map((block) => (
                    <td
                      key={block.id}
                      className="border border-black px-2 py-2 text-right"
                    >
                      {formatRupiah(item.blockTotals[block.id] ?? 0)}
                    </td>
                  ))}

                  <td className="border border-black px-2 py-2 text-right font-bold">
                    {formatRupiah(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <td
                  colSpan={2}
                  className="border border-black px-3 py-2 text-right font-bold"
                >
                  TOTAL
                </td>

                {sortedBlocks.map((block) => (
                  <td
                    key={block.id}
                    className="border border-black px-2 py-2 text-right font-bold"
                  >
                    {formatRupiah(blockYearTotals[block.id] ?? 0)}
                  </td>
                ))}

                <td className="border border-black px-2 py-2 text-right font-bold">
                  {formatRupiah(totalYear)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Ringkasan */}
          <div className="mt-5 flex justify-end">
            <table className="w-[300px] border-collapse text-[10px]">
              <tbody>
                <tr>
                  <td className="border border-black px-3 py-2 font-bold">
                    Total Transaksi
                  </td>

                  <td className="border border-black px-3 py-2 text-right">
                    {totalTransactions}
                  </td>
                </tr>

                <tr>
                  <td className="border border-black px-3 py-2 font-bold">
                    Total Persembahan
                  </td>

                  <td className="border border-black px-3 py-2 text-right font-bold">
                    {formatRupiah(totalYear)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tanda tangan */}
          <div className="mt-8 flex justify-between text-sm">
            <div className="text-center">
              <p>Mengetahui,</p>

              <div className="h-16" />

              <p className="font-semibold">__________________________</p>

              <p className="mt-1">Ketua / Bendahara</p>
            </div>

            <div className="text-center">
              <p>Admin</p>

              <div className="h-16" />

              <p className="font-semibold">__________________________</p>

              <p className="mt-1">Pengelola Data</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

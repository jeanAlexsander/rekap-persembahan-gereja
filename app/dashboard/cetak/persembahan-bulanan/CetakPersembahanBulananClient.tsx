"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, HandCoins, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

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

const blockOrder = ["A", "B", "C", "D", "E", "SK"];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
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

  // ==========================================
  // TAHUN TERSEDIA
  // ==========================================

  const years = useMemo(() => {
    return Array.from(
      new Set([
        currentYear,
        ...offerings.map((offering) => Number(offering.date.slice(0, 4))),
      ]),
    ).sort((a, b) => b - a);
  }, [offerings, currentYear]);

  // ==========================================
  // MAP MEMBER
  // ==========================================

  const memberMap = useMemo(() => {
    return new Map(members.map((member) => [member.id, member]));
  }, [members]);

  // ==========================================
  // MAP BLOCK
  // ==========================================

  const blockMap = useMemo(() => {
    return new Map(blocks.map((block) => [block.id, block]));
  }, [blocks]);

  // ==========================================
  // DATA TRANSAKSI
  // ==========================================

  const reportTransactions = useMemo(() => {
    return offerings
      .filter((offering) => {
        const year = Number(offering.date.slice(0, 4));

        const month = Number(offering.date.slice(5, 7));

        const member = memberMap.get(offering.member_id);

        if (!member) {
          return false;
        }

        const matchYear = year === Number(selectedYear);

        const matchMonth = month === Number(selectedMonth);

        const matchBlock =
          selectedBlock === "all" ||
          String(member.block_id) === String(selectedBlock);

        return matchYear && matchMonth && matchBlock;
      })
      .map((offering) => {
        const member = memberMap.get(offering.member_id);

        const block = member ? blockMap.get(member.block_id) : undefined;

        return {
          offering,
          member,
          block,
        };
      })
      .filter((item) => item.member !== undefined && item.block !== undefined)
      .sort((a, b) => {
        const blockA = a.block?.code ?? "";

        const blockB = b.block?.code ?? "";

        const blockIndexA = blockOrder.indexOf(blockA);

        const blockIndexB = blockOrder.indexOf(blockB);

        // Blok A → B → C → D → E → SK
        if (blockIndexA !== blockIndexB) {
          return (
            (blockIndexA === -1 ? 999 : blockIndexA) -
            (blockIndexB === -1 ? 999 : blockIndexB)
          );
        }

        // Kode jemaat A1 → A2 → A3 → ...
        const codeA = a.member?.code ?? "";

        const codeB = b.member?.code ?? "";

        const codeCompare = codeA.localeCompare(codeB, "id-ID", {
          numeric: true,
        });

        if (codeCompare !== 0) {
          return codeCompare;
        }

        // Kalau kode sama, tanggal terbaru
        return b.offering.date.localeCompare(a.offering.date);
      });
  }, [
    offerings,
    memberMap,
    blockMap,
    selectedYear,
    selectedMonth,
    selectedBlock,
  ]);

  // ==========================================
  // TRANSAKSI PER BLOK
  // ==========================================

  const transactionsByBlock = useMemo(() => {
    const result = new Map<
      string,
      {
        block: Block;
        items: {
          id: string;
          code: string;
          amount: number;
          date: string;
        }[];
        total: number;
      }
    >();

    reportTransactions.forEach(({ offering, member, block }) => {
      if (!member || !block) {
        return;
      }

      const existing = result.get(block.id);

      const item = {
        id: offering.id,
        code: member.code ?? "-",
        amount: Number(offering.amount),
        date: offering.date,
      };

      if (existing) {
        existing.items.push(item);
        existing.total += Number(offering.amount);
      } else {
        result.set(block.id, {
          block,
          items: [item],
          total: Number(offering.amount),
        });
      }
    });

    // ========================================
    // BLOK TERTENTU
    // ========================================

    if (selectedBlock !== "all") {
      const selected = blocks.find(
        (block) => String(block.id) === String(selectedBlock),
      );

      if (!selected) {
        return [];
      }

      const selectedData = result.get(selected.id);

      return [
        selectedData ?? {
          block: selected,
          items: [],
          total: 0,
        },
      ];
    }

    // ========================================
    // SEMUA BLOK
    // ========================================

    return blockOrder
      .map((code) => {
        const block = blocks.find((item) => item.code === code);

        if (!block) {
          return null;
        }

        return (
          result.get(block.id) ?? {
            block,
            items: [],
            total: 0,
          }
        );
      })
      .filter(
        (
          item,
        ): item is {
          block: Block;
          items: {
            id: string;
            code: string;
            amount: number;
            date: string;
          }[];
          total: number;
        } => item !== null,
      );
  }, [reportTransactions, blocks, selectedBlock]);

  // ==========================================
  // TOTAL
  // ==========================================

  const totalAmount = reportTransactions.reduce(
    (total, item) => total + Number(item.offering.amount),
    0,
  );

  const totalTransactions = reportTransactions.length;

  // ==========================================
  // LABEL
  // ==========================================

  const selectedMonthLabel =
    months.find((month) => month.value === selectedMonth)?.label ?? "";

  const selectedBlockLabel =
    selectedBlock === "all"
      ? "Semua Blok"
      : (() => {
          const block = blocks.find(
            (item) => String(item.id) === String(selectedBlock),
          );

          return block ? `${block.code} - ${block.name}` : "Semua Blok";
        })();

  // ==========================================
  // JUMLAH BARIS PRINT
  // ==========================================

  const maxRows = Math.max(
    ...transactionsByBlock.map((item) => item.items.length),
    1,
  );

  return (
    <>
      {/* ======================================
          AREA APLIKASI
      ====================================== */}

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
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  opacity: 1,
                }}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
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
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  opacity: 1,
                }}
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
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
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  opacity: 1,
                }}
              >
                <option value="all">Semua Blok</option>

                {blocks
                  .slice()
                  .sort((a, b) => {
                    const indexA = blockOrder.indexOf(a.code);

                    const indexB = blockOrder.indexOf(b.code);

                    return (
                      (indexA === -1 ? 999 : indexA) -
                      (indexB === -1 ? 999 : indexB)
                    );
                  })
                  .map((block) => (
                    <option key={block.id} value={block.id}>
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

          <div className="overflow-x-auto p-5">
            <div
              className={`grid gap-4 ${
                transactionsByBlock.length === 1
                  ? "max-w-2xl grid-cols-1"
                  : "lg:grid-cols-3"
              }`}
            >
              {transactionsByBlock.map((blockData) => (
                <div
                  key={blockData.block.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  {/* BLOCK HEADER */}

                  <div className="bg-orange-50 px-4 py-3">
                    <p className="font-bold text-orange-700">
                      BLOK {blockData.block.code}
                    </p>

                    <p className="text-xs text-gray-500">
                      {blockData.block.name}
                    </p>
                  </div>

                  {/* TABLE */}

                  <table className="w-full text-sm text-gray-900">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">
                          No
                        </th>

                        <th className="px-3 py-2 text-left font-semibold">
                          Kode
                        </th>

                        <th className="px-3 py-2 text-right font-semibold">
                          Nominal
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {blockData.items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-3 py-8 text-center text-gray-400"
                          >
                            Belum ada persembahan pada periode ini.
                          </td>
                        </tr>
                      ) : (
                        blockData.items.map((item, index) => (
                          <tr
                            key={item.id}
                            className="border-t border-gray-100"
                          >
                            <td className="px-3 py-2">{index + 1}</td>

                            <td className="px-3 py-2 font-semibold text-gray-900">
                              {item.code}
                            </td>

                            <td className="px-3 py-2 text-right">
                              {formatRupiah(item.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>

                    <tfoot className="border-t border-gray-200 bg-gray-50">
                      <tr>
                        <td
                          colSpan={2}
                          className="px-3 py-2 text-right font-bold text-gray-700"
                        >
                          TOTAL
                        </td>

                        <td className="px-3 py-2 text-right font-bold text-orange-600">
                          {formatRupiah(blockData.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))}
            </div>
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

      {/* ======================================
          PRINT AREA
      ====================================== */}

      <div className="hidden print:block">
        <div className="px-4 py-2 text-black">
          {/* HEADER */}

          <div className="mb-4 text-center">
            <h1 className="text-xl font-bold">
              REKAP LAPORAN PERSEMBAHAN BULANAN
            </h1>

            <h2 className="mt-1 text-lg font-bold">
              BULAN {selectedMonthLabel.toUpperCase()} {selectedYear}
            </h2>

            {selectedBlock !== "all" && (
              <p className="mt-1 text-sm font-semibold">{selectedBlockLabel}</p>
            )}
          </div>

          {/* PRINT TABLE */}

          <table className="w-full table-fixed border-collapse text-[8px]">
            <colgroup>
              {transactionsByBlock.map((blockData) => (
                <React.Fragment key={blockData.block.id}>
                  <col className="w-[6.666%]" />
                  <col className="w-[10%]" />
                </React.Fragment>
              ))}
            </colgroup>

            <thead>
              <tr>
                {transactionsByBlock.map((blockData) => (
                  <th
                    key={blockData.block.id}
                    colSpan={2}
                    className="border border-black bg-yellow-300 px-1 py-1 text-center font-bold"
                  >
                    BLOK {blockData.block.code}
                  </th>
                ))}
              </tr>

              <tr>
                {transactionsByBlock.map((blockData) => (
                  <React.Fragment key={blockData.block.id}>
                    <th className="border border-black px-1 py-1 text-center font-semibold">
                      Kode
                    </th>

                    <th className="border border-black px-1 py-1 text-center font-semibold">
                      Nominal
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: maxRows }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {transactionsByBlock.map((blockData) => {
                    const item = blockData.items[rowIndex];

                    return (
                      <React.Fragment key={`${blockData.block.id}-${rowIndex}`}>
                        <td className="border border-black px-1 py-1 text-center font-semibold">
                          {item?.code ?? ""}
                        </td>
                        <td className="border border-black px-1 py-1">
                          {item && (
                            <div className="grid grid-cols-[auto_1fr] items-center gap-1 text-[9px] font-semibold leading-none">
                              <span className="text-left">Rp</span>

                              <span className="text-right whitespace-nowrap">
                                {new Intl.NumberFormat("id-ID").format(
                                  item.amount,
                                )}
                              </span>
                            </div>
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}

              <tr>
                {transactionsByBlock.map((blockData) => (
                  <React.Fragment key={`total-${blockData.block.id}`}>
                    <td className="border border-black px-1 py-1 text-center font-bold">
                      TOTAL
                    </td>

                    <td className="border border-black px-1 py-1">
                      <div className="grid grid-cols-[auto_1fr] items-center gap-1 text-[9px] font-bold leading-none">
                        <span className="text-left">Rp</span>

                        <span className="text-right whitespace-nowrap">
                          {new Intl.NumberFormat("id-ID").format(
                            blockData.total,
                          )}
                        </span>
                      </div>
                    </td>
                  </React.Fragment>
                ))}
              </tr>

              <tr>
                <td
                  colSpan={transactionsByBlock.length * 2}
                  className="border border-black px-2 py-2 text-right text-[9px] font-bold"
                >
                  TOTAL KESELURUHAN {formatRupiah(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* FOOTER */}

          <div className="mt-8 grid grid-cols-2 gap-16 text-center text-sm text-black">
            {/* KETUA */}
            <div>
              <p>Mengetahui,</p>
              <p>Ketua 1</p>

              <div className="flex h-24 items-center justify-center">
                <img
                  src="/signatures/rianto.png"
                  alt="Tanda tangan Pnt. Rianto"
                  className="max-h-20 w-auto object-contain"
                />
              </div>

              <p className="font-semibold">Pnt. Rianto</p>
            </div>

            {/* BENDAHARA */}
            <div>
              <p>
                Arcawinangun, {selectedMonthLabel} {selectedYear}
              </p>

              <p>Bendahara 1</p>

              <div className="flex h-24 items-center justify-center">
                <img
                  src="/signatures/sutarno.png"
                  alt="Tanda tangan Pnt. Y Sutarno"
                  className="max-h-20 w-auto object-contain"
                />
              </div>

              <p className="font-semibold">Pnt. Y Sutarno</p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================
          PRINT STYLE
      ====================================== */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          table {
            width: 100% !important;
            table-layout: fixed !important;
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          th,
          td {
            overflow: hidden;
          }
        }
      `}</style>
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CalendarDays, HandCoins, Search, Users } from "lucide-react";

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

interface RekapClientProps {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export default function RekapClient({
  members,
  blocks,
  offerings,
}: RekapClientProps) {
  const currentYear = new Date().getFullYear();

  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth() + 1),
  );
  const [selectedBlock, setSelectedBlock] = useState("all");

  // ==========================================
  // TAHUN YANG TERSEDIA
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
  // REKAP PER JEMAAT
  // ==========================================

  const recapData = useMemo(() => {
    const searchKeyword = search.toLowerCase().trim();

    const filteredOfferings = offerings.filter((offering) => {
      const year = Number(offering.date.slice(0, 4));

      const month = Number(offering.date.slice(5, 7));

      const member = memberMap.get(offering.member_id);

      if (!member) {
        return false;
      }

      // Tahun
      const matchYear = selectedYear === "all" || year === Number(selectedYear);

      // Bulan
      const matchMonth =
        selectedMonth === "all" || month === Number(selectedMonth);

      // Blok
      const matchBlock =
        selectedBlock === "all" ||
        String(member.block_id) === String(selectedBlock);

      // Search kode / nama
      const matchSearch =
        !searchKeyword ||
        member.name.toLowerCase().includes(searchKeyword) ||
        (member.code ?? "").toLowerCase().includes(searchKeyword);

      return matchYear && matchMonth && matchBlock && matchSearch;
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
      const member = memberMap.get(offering.member_id);

      if (!member) {
        return;
      }

      const block = blockMap.get(member.block_id);

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

    return Array.from(grouped.values()).sort((a, b) => {
      const blockA = a.block?.code ?? "";

      const blockB = b.block?.code ?? "";

      const indexA = blockOrder.indexOf(blockA);

      const indexB = blockOrder.indexOf(blockB);

      if (indexA !== indexB) {
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      }

      return (a.member.code ?? "").localeCompare(b.member.code ?? "", "id-ID", {
        numeric: true,
      });
    });
  }, [
    offerings,
    memberMap,
    blockMap,
    selectedYear,
    selectedMonth,
    selectedBlock,
    search,
  ]);

  // ==========================================
  // REKAP TOTAL PER BLOK
  // ==========================================

  const blockRecap = useMemo(() => {
    const recapMap = new Map<
      string,
      {
        id: string;
        code: string;
        name: string;
        members: number;
        transactions: number;
        total: number;
      }
    >();

    recapData.forEach((item) => {
      if (!item.block) {
        return;
      }

      const existing = recapMap.get(item.block.id);

      if (existing) {
        existing.members += 1;
        existing.transactions += item.transactions;
        existing.total += item.total;
      } else {
        recapMap.set(item.block.id, {
          id: item.block.id,
          code: item.block.code,
          name: item.block.name,
          members: 1,
          transactions: item.transactions,
          total: item.total,
        });
      }
    });

    return Array.from(recapMap.values()).sort((a, b) => {
      const indexA = blockOrder.indexOf(a.code);

      const indexB = blockOrder.indexOf(b.code);

      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [recapData]);

  // ==========================================
  // TOTAL
  // ==========================================

  const totalAmount = recapData.reduce((total, item) => total + item.total, 0);

  const totalTransactions = recapData.reduce(
    (total, item) => total + item.transactions,
    0,
  );

  const totalMembers = recapData.length;

  // ==========================================
  // LABEL BULAN
  // ==========================================

  const selectedMonthLabel =
    selectedMonth === "all"
      ? "Semua Bulan"
      : (months.find((month) => month.value === selectedMonth)?.label ?? "");

  return (
    <div className="space-y-6">
      {/* ======================================
          HEADER
      ====================================== */}

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <HandCoins size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Rekap Persembahan
            </h1>

            <p className="text-sm text-gray-500">
              Rekap persembahan berdasarkan periode.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================
          SUMMARY
      ====================================== */}

      <div className="grid gap-4 md:grid-cols-3">
        {/* TOTAL PERSEMBAHAN */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Persembahan</p>

              <p className="mt-2 text-xl font-bold text-gray-900">
                {formatRupiah(totalAmount)}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <HandCoins size={21} />
            </div>
          </div>
        </div>

        {/* TOTAL TRANSAKSI */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Jumlah Transaksi</p>

              <p className="mt-2 text-xl font-bold text-gray-900">
                {totalTransactions}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <CalendarDays size={21} />
            </div>
          </div>
        </div>

        {/* JEMAAT */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Jemaat Memberi</p>

              <p className="mt-2 text-xl font-bold text-gray-900">
                {totalMembers}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Users size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================
          FILTER
      ====================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900">Filter Rekap</h2>

          <p className="mt-1 text-sm text-gray-500">
            Gunakan filter untuk melihat data tertentu.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {/* SEARCH */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Cari Jemaat
            </label>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari kode atau nama..."
                className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  opacity: 1,
                }}
              />
            </div>
          </div>

          {/* TAHUN */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tahun
            </label>

            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              style={{
                backgroundColor: "#ffffff",
                color: "#111827",
                opacity: 1,
              }}
            >
              <option value="all">Semua Tahun</option>

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
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              style={{
                backgroundColor: "#ffffff",
                color: "#111827",
                opacity: 1,
              }}
            >
              <option value="all">Semua Bulan</option>

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
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              style={{
                backgroundColor: "#ffffff",
                color: "#111827",
                opacity: 1,
              }}
            >
              <option value="all">Semua Blok</option>

              {blocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.code} - {block.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ======================================
          TOTAL PER BLOK
      ====================================== */}

      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">Total per Blok</h2>

          <p className="text-sm text-gray-500">
            Ringkasan persembahan berdasarkan blok.
          </p>
        </div>

        {blockRecap.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            Tidak ada data persembahan untuk filter yang dipilih.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blockRecap.map((block) => (
              <div
                key={block.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-orange-100 px-2 text-sm font-bold text-orange-600">
                      {block.code}
                    </span>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {block.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        {block.members} jemaat · {block.transactions} transaksi
                      </p>
                    </div>
                  </div>

                  <HandCoins size={20} className="shrink-0 text-orange-500" />
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500">
                    Total Persembahan
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatRupiah(block.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================
          TABLE
      ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Rekap Jemaat</h2>

          <p className="mt-1 text-sm text-gray-500">
            {selectedMonthLabel} {selectedYear !== "all" ? selectedYear : ""}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-5 py-3 text-left font-semibold text-gray-600">
                  No
                </th>

                <th className="px-5 py-3 text-left font-semibold text-gray-600">
                  Kode Jemaat
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
              {recapData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    Tidak ada data persembahan untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                recapData.map((item, index) => (
                  <tr
                    key={item.member.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    {/* NO */}
                    <td className="px-5 py-4 text-gray-500">{index + 1}</td>

                    {/* KODE */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
                        {item.member.code ?? "-"}
                      </span>
                    </td>

                    {/* BLOK */}
                    <td className="px-5 py-4">
                      {item.block ? (
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.block.code}
                          </p>

                          <p className="text-xs text-gray-500">
                            {item.block.name}
                          </p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* TRANSAKSI */}
                    <td className="px-5 py-4 text-center text-gray-600">
                      {item.transactions}
                    </td>

                    {/* TANGGAL */}
                    <td className="px-5 py-4 text-center text-gray-600">
                      {formatDate(item.lastDate)}
                    </td>

                    {/* TOTAL */}
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {formatRupiah(item.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {recapData.length > 0 && (
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
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  HandCoins,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmModal from "@/components/dashboard/ConfirmModal";

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

interface PersembahanClientProps {
  members: Member[];
  blocks: Block[];
  initialOfferings: Offering[];
}

export default function PersembahanClient({
  members,
  blocks,
  initialOfferings,
}: PersembahanClientProps) {
  const supabase = createClient();

  // =========================
  // DATA
  // =========================
  const [offerings, setOfferings] = useState<Offering[]>(initialOfferings);

  // =========================
  // FILTER
  // =========================
  const [search, setSearch] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");

  // =========================
  // MODAL FORM
  // =========================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // =========================
  // FORM
  // =========================
  const [memberCode, setMemberCode] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  // =========================
  // STATE
  // =========================
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // DELETE MODAL
  // =========================
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deletingOffering, setDeletingOffering] = useState<Offering | null>(
    null,
  );

  // =========================
  // DAFTAR BULAN
  // =========================
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

  // =========================
  // DAFTAR TAHUN
  // =========================
  const years = useMemo(() => {
    return Array.from(
      new Set([
        new Date().getFullYear(),
        ...offerings.map((offering) =>
          new Date(`${offering.date}T00:00:00`).getFullYear(),
        ),
      ]),
    ).sort((a, b) => b - a);
  }, [offerings]);

  // =========================
  // MEMBER DARI KODE
  // =========================
  const selectedMember = useMemo(() => {
    const cleanCode = memberCode.trim().toLowerCase();

    if (!cleanCode) return null;

    return (
      members.find(
        (member) => (member.code ?? "").trim().toLowerCase() === cleanCode,
      ) ?? null
    );
  }, [members, memberCode]);

  // =========================
  // BLOK MEMBER
  // =========================
  const selectedBlockData = useMemo(() => {
    if (!selectedMember) return null;

    return blocks.find((block) => block.id === selectedMember.block_id) ?? null;
  }, [blocks, selectedMember]);

  // =========================
  // FILTERED OFFERINGS
  // =========================
  const filteredOfferings = useMemo(() => {
    return offerings
      .filter((offering) => {
        const member = members.find(
          (member) => member.id === offering.member_id,
        );

        if (!member) return false;

        const offeringDate = new Date(`${offering.date}T00:00:00`);

        const offeringMonth = offeringDate.getMonth() + 1;

        const offeringYear = offeringDate.getFullYear();

        // SEARCH
        const searchValue = search.toLowerCase().trim();

        const matchSearch =
          member.name.toLowerCase().includes(searchValue) ||
          (member.code ?? "").toLowerCase().includes(searchValue);

        // FILTER BLOK
        const matchBlock =
          selectedBlock === "all" ||
          String(member.block_id) === String(selectedBlock);

        // FILTER BULAN
        const matchMonth =
          selectedMonth === "all" || offeringMonth === Number(selectedMonth);

        // FILTER TAHUN
        const matchYear =
          selectedYear === "all" || offeringYear === Number(selectedYear);

        return matchSearch && matchBlock && matchMonth && matchYear;
      })
      .sort((a, b) => {
        // 1. Tanggal terbaru → terlama
        const dateCompare =
          new Date(`${b.date}T00:00:00`).getTime() -
          new Date(`${a.date}T00:00:00`).getTime();

        if (dateCompare !== 0) {
          return dateCompare;
        }

        // 2. Jika tanggal sama → kode jemaat A-Z
        const codeA =
          members.find((member) => member.id === a.member_id)?.code ?? "";

        const codeB =
          members.find((member) => member.id === b.member_id)?.code ?? "";

        return codeA.localeCompare(codeB, "id-ID", { numeric: true });
      });
  }, [offerings, members, search, selectedBlock, selectedMonth, selectedYear]);

  // =========================
  // TOTAL PERSEMBAHAN
  // =========================
  const totalAmount = useMemo(() => {
    return filteredOfferings.reduce(
      (total, offering) => total + Number(offering.amount),
      0,
    );
  }, [filteredOfferings]);

  // =========================
  // TOTAL TRANSAKSI
  // =========================
  const totalTransactions = filteredOfferings.length;

  // =========================
  // OPEN TAMBAH MODAL
  // =========================
  function openAddModal() {
    setEditingId(null);
    setMemberCode("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setNote("");
    setError("");
    setIsModalOpen(true);
  }

  // =========================
  // OPEN EDIT MODAL
  // =========================
  function openEditModal(offering: Offering) {
    const member = members.find((item) => item.id === offering.member_id);

    setEditingId(offering.id);
    setMemberCode(member?.code ?? "");
    setAmount(String(offering.amount));
    setDate(offering.date);
    setNote(offering.note ?? "");
    setError("");
    setIsModalOpen(true);
  }

  // =========================
  // CLOSE FORM MODAL
  // =========================
  function closeModal() {
    if (loading) return;

    setIsModalOpen(false);
    setEditingId(null);
    setMemberCode("");
    setAmount("");
    setDate("");
    setNote("");
    setError("");
  }

  // =========================
  // FORMAT RUPIAH
  // =========================
  function formatRupiah(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  // =========================
  // FORMAT TANGGAL
  // =========================
  function formatDate(value: string) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  }

  function formatInputRupiah(value: string) {
    const number = value.replace(/\D/g, "");

    if (!number) {
      return "";
    }

    return new Intl.NumberFormat("id-ID").format(Number(number));
  }

  // =========================
  // SUBMIT FORM
  // =========================
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanAmount = amount.replace(/\./g, "");
    const numericAmount = Number(cleanAmount);

    const cleanCode = memberCode.trim().toUpperCase();

    if (!cleanCode) {
      setError("Kode jemaat wajib diisi.");
      return;
    }

    if (!selectedMember) {
      setError(`Kode jemaat "${cleanCode}" tidak ditemukan.`);
      return;
    }

    if (!cleanAmount || numericAmount <= 0) {
      setError("Nominal harus lebih dari 0.");
      return;
    }

    if (!date) {
      setError("Tanggal wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    // =========================
    // EDIT
    // =========================
    if (editingId) {
      const { data, error } = await supabase
        .from("offerings")
        .update({
          member_id: selectedMember.id,
          amount: numericAmount,
          date,
          note: note.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId)
        .select("id, member_id, amount, date, note, created_at, updated_at")
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Data persembahan tidak ditemukan setelah diperbarui.");
        setLoading(false);
        return;
      }

      setOfferings((current) =>
        current.map((offering) =>
          offering.id === editingId ? data : offering,
        ),
      );

      setLoading(false);
      closeModal();
      return;
    }

    // =========================
    // TAMBAH
    // =========================
    const { data, error } = await supabase
      .from("offerings")
      .insert({
        member_id: selectedMember.id,
        amount: numericAmount,
        date,
        note: note.trim() || null,
      })
      .select("id, member_id, amount, date, note, created_at, updated_at")
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setError("Data persembahan tidak ditemukan setelah disimpan.");
      setLoading(false);
      return;
    }

    setOfferings((current) => [data, ...current]);

    setLoading(false);
    closeModal();
  }

  // =========================
  // OPEN DELETE MODAL
  // =========================
  function openDeleteModal(offering: Offering) {
    setDeletingOffering(offering);
    setShowDeleteModal(true);
  }

  // =========================
  // CLOSE DELETE MODAL
  // =========================
  function closeDeleteModal() {
    if (loading) return;

    setShowDeleteModal(false);
    setDeletingOffering(null);
  }

  // =========================
  // CONFIRM DELETE
  // =========================
  async function handleConfirmDelete() {
    if (!deletingOffering) return;

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase
        .from("offerings")
        .delete()
        .eq("id", deletingOffering.id);

      if (error) {
        console.error("Gagal menghapus persembahan:", error);

        setError(error.message);
        return;
      }

      setOfferings((current) =>
        current.filter((offering) => offering.id !== deletingOffering.id),
      );

      setShowDeleteModal(false);
      setDeletingOffering(null);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // MEMBER YANG DIHAPUS
  // =========================
  const deletingMember = deletingOffering
    ? members.find((member) => member.id === deletingOffering.member_id)
    : null;

  return (
    <div className="mx-auto max-w-7xl">
      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <HandCoins size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Persembahan</h1>

              <p className="text-sm text-gray-500">
                Kelola data persembahan jemaat.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
        >
          <Plus size={18} />
          Tambah Persembahan
        </button>
      </div>

      {/* =========================
          FILTER
      ========================= */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* SEARCH */}
          <div className="relative">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari kode atau nama jemaat..."
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              style={{
                backgroundColor: "#ffffff",
                color: "#111827",
                opacity: 1,
              }}
            />
          </div>

          {/* BLOK */}
          <select
            value={selectedBlock}
            onChange={(event) => setSelectedBlock(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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

          {/* BULAN */}
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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

          {/* TAHUN */}
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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
      </div>

      {/* =========================
          SUMMARY
      ========================= */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
              <HandCoins size={21} />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Persembahan
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatRupiah(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
              <HandCoins size={21} />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                Jumlah Transaksi
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalTransactions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          ERROR
      ========================= */}
      {error && !isModalOpen && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* =========================
          TABLE
      ========================= */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">No</th>

                <th className="px-6 py-4 font-semibold text-gray-700">
                  Kode Jemaat
                </th>

                <th className="px-6 py-4 font-semibold text-gray-700">
                  Nama Jemaat
                </th>

                <th className="px-6 py-4 font-semibold text-gray-700">Blok</th>

                <th className="px-6 py-4 font-semibold text-gray-700">
                  Nominal
                </th>

                <th className="px-6 py-4 font-semibold text-gray-700">
                  Tanggal
                </th>

                <th className="px-6 py-4 text-right font-semibold text-gray-700">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredOfferings.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Belum ada data persembahan.
                  </td>
                </tr>
              ) : (
                filteredOfferings.map((offering, index) => {
                  const member = members.find(
                    (member) => member.id === offering.member_id,
                  );

                  const block = blocks.find(
                    (block) => block.id === member?.block_id,
                  );

                  return (
                    <tr
                      key={offering.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-gray-600">{index + 1}</td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600">
                          {member?.code ?? "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {member?.name ?? "-"}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
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

                      <td className="px-6 py-4">
                        <span className="whitespace-nowrap text-base font-bold text-gray-900">
                          {formatRupiah(Number(offering.amount))}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {formatDate(offering.date)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(offering)}
                            disabled={loading}
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Edit"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(offering)}
                            disabled={loading}
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Hapus"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
    MODAL TAMBAH / EDIT
========================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            {/* =========================
          HEADER
      ========================= */}
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Persembahan" : "Tambah Persembahan"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingId
                    ? "Perbarui data persembahan jemaat."
                    : "Masukkan kode jemaat, nominal, dan tanggal."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {/* =========================
          FORM
      ========================= */}
            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              {/* =========================
            KODE JEMAAT
        ========================= */}
              <div>
                <label
                  htmlFor="kode-jemaat-persembahan"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Kode Jemaat
                </label>

                <input
                  id="kode-jemaat-persembahan"
                  type="text"
                  value={memberCode}
                  onChange={(event) => {
                    setMemberCode(event.target.value.toUpperCase());
                    setError("");
                  }}
                  placeholder="Contoh: A1 atau SK1"
                  autoComplete="off"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base font-semibold uppercase tracking-wide text-gray-900 outline-none transition placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />

                <p className="mt-1.5 text-xs text-gray-500">
                  Masukkan kode resmi jemaat.
                </p>

                {/* =========================
              MEMBER DITEMUKAN
          ========================= */}
                {memberCode.trim() && selectedMember && (
                  <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        size={20}
                        className="mt-0.5 shrink-0 text-green-600"
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                          {selectedMember.name}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                          <p>
                            Kode:{" "}
                            <span className="font-semibold text-gray-900">
                              {selectedMember.code}
                            </span>
                          </p>

                          <p>
                            Blok:{" "}
                            <span className="font-semibold text-gray-900">
                              {selectedBlockData?.code ?? "-"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================
              MEMBER TIDAK DITEMUKAN
          ========================= */}
                {memberCode.trim() && !selectedMember && (
                  <div className="mt-2 rounded-lg bg-red-50 px-3 py-2">
                    <p className="text-sm font-medium text-red-600">
                      Kode jemaat tidak ditemukan.
                    </p>
                  </div>
                )}
              </div>

              {/* =========================
            NOMINAL
        ========================= */}
              <div>
                <label
                  htmlFor="nominal-persembahan"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Nominal
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-500">
                    Rp
                  </span>

                  <input
                    id="nominal-persembahan"
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(event) => {
                      setAmount(formatInputRupiah(event.target.value));
                      setError("");
                    }}
                    placeholder="100.000"
                    disabled={loading}
                    className="h-14 w-full rounded-xl border border-gray-300 bg-white pl-12 pr-4 text-xl font-bold tracking-wide text-gray-900 outline-none transition placeholder:font-normal placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                </div>

                <p className="mt-1.5 text-xs text-gray-500">
                  Contoh: 100.000 atau 1.500.000
                </p>
              </div>

              {/* =========================
            TANGGAL
        ========================= */}
              <div>
                <label
                  htmlFor="tanggal-persembahan"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Tanggal
                </label>

                <input
                  id="tanggal-persembahan"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              {/* =========================
            ERROR
        ========================= */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-600">{error}</p>
                </div>
              )}

              {/* =========================
            BUTTON
        ========================= */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Menyimpan..."
                    : editingId
                      ? "Simpan Perubahan"
                      : "Simpan Persembahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================
          MODAL KONFIRMASI HAPUS
      ========================= */}
      <ConfirmModal
        open={showDeleteModal}
        title="Hapus Persembahan?"
        message={
          deletingOffering
            ? `Apakah Anda yakin ingin menghapus transaksi persembahan dari "${
                deletingMember?.code ?? "-"
              } - ${deletingMember?.name ?? "-"}" sebesar ${formatRupiah(
                Number(deletingOffering.amount),
              )} pada ${formatDate(deletingOffering.date)}?`
            : "Apakah Anda yakin ingin menghapus data persembahan ini?"
        }
        confirmText="Hapus Persembahan"
        loading={loading}
        onCancel={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

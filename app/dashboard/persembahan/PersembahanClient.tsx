"use client";

import { useState } from "react";
import { Plus, Search, X, Pencil, Trash2, HandCoins } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmModal from "@/components/dashboard/ConfirmModal";

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
  // MODAL
  // =========================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // =========================
  // FORM
  // =========================
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  // =========================
  // STATE
  // =========================
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
  const years = Array.from(
    new Set([
      new Date().getFullYear(),
      ...offerings.map((offering) =>
        new Date(`${offering.date}T00:00:00`).getFullYear(),
      ),
    ]),
  ).sort((a, b) => b - a);

  // =========================
  // OPEN TAMBAH MODAL
  // =========================
  function openAddModal() {
    setEditingId(null);
    setMemberId("");
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
    setEditingId(offering.id);
    setMemberId(offering.member_id);
    setAmount(String(offering.amount));
    setDate(offering.date);
    setNote(offering.note ?? "");
    setError("");
    setIsModalOpen(true);
  }

  // =========================
  // CLOSE MODAL
  // =========================
  function closeModal() {
    if (loading) return;

    setIsModalOpen(false);
    setEditingId(null);
    setMemberId("");
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

  // =========================
  // SELECTED MEMBER
  // =========================
  const selectedMember = members.find(
    (member) => String(member.id) === String(memberId),
  );

  // =========================
  // SELECTED BLOCK
  // =========================
  const selectedBlockData = blocks.find(
    (block) => String(block.id) === String(selectedMember?.block_id),
  );

  // =========================
  // FILTERED OFFERINGS
  // =========================
  const filteredOfferings = offerings
    .filter((offering) => {
      const member = members.find((member) => member.id === offering.member_id);

      if (!member) return false;

      const offeringDate = new Date(`${offering.date}T00:00:00`);

      const offeringMonth = offeringDate.getMonth() + 1;
      const offeringYear = offeringDate.getFullYear();

      // SEARCH
      const matchSearch = member.name
        .toLowerCase()
        .includes(search.toLowerCase());

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
        new Date(b.date).getTime() - new Date(a.date).getTime();

      if (dateCompare !== 0) {
        return dateCompare;
      }

      // 2. Jika tanggal sama → nama jemaat A-Z
      const nameA =
        members.find((member) => member.id === a.member_id)?.name ?? "";

      const nameB =
        members.find((member) => member.id === b.member_id)?.name ?? "";

      return nameA.localeCompare(nameB, "id-ID");
    });

  // =========================
  // TOTAL PERSEMBAHAN
  // =========================
  const totalAmount = filteredOfferings.reduce(
    (total, offering) => total + Number(offering.amount),
    0,
  );

  // =========================
  // TOTAL TRANSAKSI
  // =========================
  const totalTransactions = filteredOfferings.length;

  // =========================
  // SUBMIT FORM
  // =========================
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!memberId) {
      setError("Nama jemaat wajib dipilih.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
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
    // EDIT PERSEMBAHAN
    // =========================
    if (editingId) {
      const { data, error } = await supabase
        .from("offerings")
        .update({
          member_id: memberId,
          amount: Number(amount),
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
    // TAMBAH PERSEMBAHAN
    // =========================
    const { data, error } = await supabase
      .from("offerings")
      .insert({
        member_id: memberId,
        amount: Number(amount),
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
              placeholder="Cari nama jemaat..."
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              style={{
                backgroundColor: "#ffffff",
                color: "#111827",
                opacity: 1,
              }}
            />
          </div>

          {/* FILTER BLOK */}
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

          {/* FILTER BULAN */}
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
            <option
              value="all"
              style={{
                backgroundColor: "#ffffff",
                color: "#111827",
              }}
            >
              Semua Bulan
            </option>

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

          {/* FILTER TAHUN */}
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
            <option
              value="all"
              style={{
                backgroundColor: "#ffffff",
                color: "#111827",
              }}
            >
              Semua Tahun
            </option>

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
      </div>

      {/* =========================
          SUMMARY
      ========================= */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* TOTAL PERSEMBAHAN */}
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

        {/* TOTAL TRANSAKSI */}
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
                  Nama Jemaat
                </th>

                <th className="px-6 py-4 font-semibold text-gray-700">Blok</th>

                <th className="px-6 py-4 font-semibold text-gray-700">
                  Nominal
                </th>

                <th className="px-6 py-4 font-semibold text-gray-700">
                  Tanggal
                </th>

                <th className="px-6 py-4 font-semibold text-gray-700">
                  Catatan
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
                    colSpan={7}
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
                      {/* NO */}
                      <td className="px-6 py-4 text-gray-600">{index + 1}</td>

                      {/* NAMA */}
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {member?.name ?? "-"}
                      </td>

                      {/* BLOK */}
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

                      {/* NOMINAL */}
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatRupiah(offering.amount)}
                      </td>

                      {/* TANGGAL */}
                      <td className="px-6 py-4 text-gray-700">
                        {formatDate(offering.date)}
                      </td>

                      {/* CATATAN */}
                      <td className="px-6 py-4 text-gray-600">
                        {offering.note || "-"}
                      </td>

                      {/* AKSI */}
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
          MODAL
      ========================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
            {/* HEADER MODAL */}
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Persembahan" : "Tambah Persembahan"}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {editingId
                    ? "Perbarui data persembahan jemaat."
                    : "Tambahkan data persembahan jemaat."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              {/* NAMA JEMAAT */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Nama Jemaat
                </label>

                <select
                  value={memberId}
                  onChange={(event) => setMemberId(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">Pilih jemaat</option>

                  {members
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* BLOK */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Blok
                </label>

                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  {selectedBlockData ? (
                    <p className="text-sm font-medium text-gray-900">
                      {selectedBlockData.code} - {selectedBlockData.name}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Blok akan muncul setelah jemaat dipilih.
                    </p>
                  )}
                </div>
              </div>

              {/* NOMINAL */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Nominal
                </label>

                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Contoh: 100000"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* TANGGAL */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Tanggal
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* CATATAN */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Catatan{" "}
                  <span className="font-normal text-gray-500">(opsional)</span>
                </label>

                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="Tambahkan catatan jika diperlukan..."
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* BUTTON */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
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
      <ConfirmModal
        open={showDeleteModal}
        title="Hapus Persembahan?"
        message={
          deletingOffering
            ? `Apakah Anda yakin ingin menghapus transaksi persembahan dari "${
                members.find(
                  (member) => member.id === deletingOffering.member_id,
                )?.name ?? "-"
              }" sebesar ${formatRupiah(
                deletingOffering.amount,
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

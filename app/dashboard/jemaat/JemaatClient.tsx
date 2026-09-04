"use client";

import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
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
  created_at: string;
  blocks: Block[] | null;
};

interface JemaatClientProps {
  initialMembers: Member[];
  blocks: Block[];
}

export default function JemaatClient({
  initialMembers,
  blocks,
}: JemaatClientProps) {
  const supabase = createClient();

  const [members, setMembers] = useState<Member[]>(initialMembers);

  const [search, setSearch] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("all");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [blockId, setBlockId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  const filteredMembers = members
    .filter((member) => {
      const matchSearch = member.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchBlock =
        selectedBlock === "all" ||
        String(member.block_id) === String(selectedBlock);

      return matchSearch && matchBlock;
    })
    .sort((a, b) => {
      const blockA = a.blocks?.[0]?.code ?? "";
      const blockB = b.blocks?.[0]?.code ?? "";

      const order = ["A", "B", "C", "D", "E", "SK"];

      const indexA = order.indexOf(blockA);
      const indexB = order.indexOf(blockB);

      // Urutkan berdasarkan blok
      if (indexA !== indexB) {
        return indexA - indexB;
      }

      // Kalau blok sama, urutkan berdasarkan nama
      return a.name.localeCompare(b.name);
    });

  function openAddForm() {
    setEditingId(null);
    setName("");
    setBlockId(blocks[0]?.id ?? "");
    setError("");
    setShowForm(true);
  }

  function openEditForm(member: Member) {
    setEditingId(member.id);
    setName(member.name);
    setBlockId(member.block_id);
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setBlockId("");
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Nama jemaat wajib diisi.");
      return;
    }

    if (!blockId) {
      setError("Blok wajib dipilih.");
      return;
    }

    setLoading(true);
    setError("");

    // =========================
    // EDIT DATA JEMAAT
    // =========================
    if (editingId) {
      const { data, error } = await supabase
        .from("members")
        .update({
          name: name.trim(),
          block_id: blockId,
        })
        .eq("id", editingId)
        .select("id, name, block_id, created_at")
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Data jemaat tidak ditemukan setelah diperbarui.");
        setLoading(false);
        return;
      }

      // Cari blok berdasarkan ID
      const selectedBlock = blocks.find(
        (block) => String(block.id) === String(blockId),
      );

      setMembers((current) =>
        current.map((member) =>
          member.id === editingId
            ? {
                ...member,
                name: data.name,
                block_id: data.block_id,
                created_at: data.created_at,
                blocks: selectedBlock ? [selectedBlock] : [],
              }
            : member,
        ),
      );
    }

    // =========================
    // TAMBAH DATA JEMAAT
    // =========================
    else {
      const { data, error } = await supabase
        .from("members")
        .insert({
          name: name.trim(),
          block_id: blockId,
        })
        .select("id, name, block_id, created_at")
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Data jemaat tidak ditemukan setelah disimpan.");
        setLoading(false);
        return;
      }

      // Cari blok yang dipilih
      const selectedBlock = blocks.find(
        (block) => String(block.id) === String(blockId),
      );

      // Jika blok ditemukan, masukkan ke data baru
      const newMember: Member = {
        id: data.id,
        name: data.name,
        block_id: data.block_id,
        created_at: data.created_at,
        blocks: selectedBlock ? [selectedBlock] : [],
      };

      setMembers((current) =>
        [...current, newMember].sort((a, b) => a.name.localeCompare(b.name)),
      );
    }

    setLoading(false);
    closeForm();
  }

  function openDeleteModal(member: Member) {
    setDeletingMember(member);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (loading) return;

    setShowDeleteModal(false);
    setDeletingMember(null);
  }

  async function handleConfirmDelete() {
    if (!deletingMember) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", deletingMember.id);

      if (error) {
        console.error("Gagal menghapus jemaat:", error);
        alert(`Gagal menghapus: ${error.message}`);
        return;
      }

      setMembers((current) =>
        current.filter((item) => item.id !== deletingMember.id),
      );

      setShowDeleteModal(false);
      setDeletingMember(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Users size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data Jemaat</h1>

              <p className="text-sm text-gray-500">
                Kelola data jemaat berdasarkan blok.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddForm}
          className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          <Plus size={19} />
          Tambah Jemaat
        </button>
      </div>

      {/* Filter */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Search */}
          <div className="relative">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama jemaat..."
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              style={{
                backgroundColor: "#ffffff",
                color: "#111827",
                opacity: 1,
              }}
            />
          </div>

          {/* Filter Blok */}
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
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
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-700">
                  No
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-700">
                  Nama Jemaat
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-700">
                  Kode Blok
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-700">
                  Nama Blok
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-700">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    Belum ada data jemaat.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => (
                  <tr key={member.id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{member.name}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                        {member.blocks?.[0]?.code ?? "-"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {member.blocks?.[0]?.name ?? "-"}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditForm(member)}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-orange-50 hover:text-orange-600"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(member)}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Jemaat" : "Tambah Jemaat"}
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Masukkan data jemaat dengan benar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nama */}
              <div>
                <label
                  htmlFor="nama-jemaat"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Nama Jemaat
                </label>

                <input
                  id="nama-jemaat"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* Blok */}
              <div>
                <label
                  htmlFor="blok-jemaat"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Blok
                </label>

                <select
                  id="blok-jemaat"
                  value={blockId}
                  onChange={(e) => setBlockId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">Pilih Blok</option>

                  {blocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.code} - {block.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Menyimpan..."
                    : editingId
                      ? "Simpan Perubahan"
                      : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Hapus */}
      <ConfirmModal
        open={showDeleteModal}
        title="Hapus Jemaat?"
        message={
          deletingMember
            ? `Apakah Anda yakin ingin menghapus jemaat "${deletingMember.name}"?`
            : "Apakah Anda yakin ingin menghapus data jemaat ini?"
        }
        confirmText="Hapus Jemaat"
        loading={loading}
        onCancel={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

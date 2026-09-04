"use client";

import { useMemo, useState } from "react";
import { Building2, Edit, Plus, Search, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Block {
  id: string;
  code: string;
  name: string;
}

interface Member {
  id: string;
  block_id: string | null;
}

interface BlokClientProps {
  initialBlocks: Block[];
  initialMembers: Member[];
}

export default function BlokClient({
  initialBlocks,
  initialMembers,
}: BlokClientProps) {
  const supabase = createClient();

  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [members] = useState<Member[]>(initialMembers);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);

  // ==========================================
  // FILTER BLOK
  // ==========================================

  const filteredBlocks = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return blocks;
    }

    return blocks.filter(
      (block) =>
        block.code.toLowerCase().includes(keyword) ||
        block.name.toLowerCase().includes(keyword),
    );
  }, [blocks, search]);

  // ==========================================
  // JUMLAH JEMAAT PER BLOK
  // ==========================================

  function getMemberCount(blockId: string) {
    return members.filter((member) => member.block_id === blockId).length;
  }

  // ==========================================
  // MODAL TAMBAH BLOK
  // ==========================================

  function openAddModal() {
    setEditingBlock(null);
    setCode("");
    setName("");
    setShowModal(true);
  }

  // ==========================================
  // MODAL EDIT BLOK
  // ==========================================

  function openEditModal(block: Block) {
    setEditingBlock(block);
    setCode(block.code);
    setName(block.name);
    setShowModal(true);
  }

  // ==========================================
  // TUTUP MODAL
  // ==========================================

  function closeModal() {
    if (loading) return;

    setShowModal(false);
    setEditingBlock(null);
    setCode("");
    setName("");
  }

  // ==========================================
  // SIMPAN DATA BLOK
  // ==========================================

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanCode || !cleanName) {
      alert("Kode dan nama blok wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      // ========================================
      // UPDATE BLOK
      // ========================================

      if (editingBlock) {
        const { data, error } = await supabase
          .from("blocks")
          .update({
            code: cleanCode,
            name: cleanName,
          })
          .eq("id", editingBlock.id)
          .select("id, code, name")
          .single();

        if (error) {
          console.error("Gagal mengubah blok:", error);
          alert(`Gagal mengubah blok: ${error.message}`);
          return;
        }

        setBlocks((prev) =>
          prev
            .map((block) => (block.id === editingBlock.id ? data : block))
            .sort((a, b) => a.code.localeCompare(b.code)),
        );
      }

      // ========================================
      // TAMBAH BLOK
      // ========================================
      else {
        const { data, error } = await supabase
          .from("blocks")
          .insert({
            code: cleanCode,
            name: cleanName,
          })
          .select("id, code, name")
          .single();

        if (error) {
          console.error("Gagal menambahkan blok:", error);
          alert(`Gagal menambahkan blok: ${error.message}`);
          return;
        }

        setBlocks((prev) =>
          [...prev, data].sort((a, b) => a.code.localeCompare(b.code)),
        );
      }

      closeModal();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Building2 size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Blok</h1>

            <p className="text-sm text-gray-500">
              Kelola data blok jemaat gereja
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
        >
          <Plus size={19} />
          Tambah Blok
        </button>
      </div>

      {/* ====================================== */}
      {/* SUMMARY */}
      {/* ====================================== */}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {/* Total Blok */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Blok</p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {blocks.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Building2 size={22} />
            </div>
          </div>
        </div>

        {/* Total Jemaat */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Jemaat</p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {members.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <Users size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* SEARCH */}
      {/* ====================================== */}

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode atau nama blok..."
            className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            style={{
              backgroundColor: "#ffffff",
              color: "#111827",
              opacity: 1,
            }}
          />
        </div>
      </div>

      {/* ====================================== */}
      {/* TABLE */}
      {/* ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-4 text-center font-semibold text-gray-700">
                  No
                </th>

                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Kode
                </th>

                <th className="px-5 py-4 text-left font-semibold text-gray-700">
                  Nama Blok
                </th>

                <th className="px-5 py-4 text-center font-semibold text-gray-700">
                  Jumlah Jemaat
                </th>

                <th className="px-5 py-4 text-center font-semibold text-gray-700">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredBlocks.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    {search
                      ? "Data blok tidak ditemukan."
                      : "Belum ada data blok."}
                  </td>
                </tr>
              ) : (
                filteredBlocks.map((block, index) => {
                  const memberCount = getMemberCount(block.id);

                  return (
                    <tr
                      key={block.id}
                      className="border-b border-gray-100 transition hover:bg-gray-50"
                    >
                      {/* No */}
                      <td className="px-5 py-4 text-center text-gray-600">
                        {index + 1}
                      </td>

                      {/* Kode */}
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-orange-50 px-3 py-1.5 font-semibold text-orange-600">
                          {block.code}
                        </span>
                      </td>

                      {/* Nama */}
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {block.name}
                      </td>

                      {/* Jumlah Jemaat */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 font-medium text-gray-700">
                          <Users size={15} />
                          {memberCount}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => openEditModal(block)}
                            title="Edit"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-orange-50 hover:text-orange-600"
                          >
                            <Edit size={17} />
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

      {/* ====================================== */}
      {/* MODAL TAMBAH / EDIT */}
      {/* ====================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">
                  {editingBlock ? "Edit Blok" : "Tambah Blok"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Masukkan informasi blok jemaat
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5">
              <div className="space-y-4">
                {/* Kode Blok */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Kode Blok
                  </label>

                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: A"
                    maxLength={10}
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#111827",
                      opacity: 1,
                    }}
                  />
                </div>

                {/* Nama Blok */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nama Blok
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Blok A"
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#111827",
                      opacity: 1,
                    }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Menyimpan..."
                    : editingBlock
                      ? "Simpan Perubahan"
                      : "Tambah Blok"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

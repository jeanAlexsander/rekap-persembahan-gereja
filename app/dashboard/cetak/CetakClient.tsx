"use client";

import { useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  HandCoins,
  Printer,
  Users,
} from "lucide-react";

const reports = [
  {
    title: "Rekap Persembahan Bulanan",
    description: "Cetak rekap persembahan berdasarkan bulan, tahun, dan blok.",
    icon: HandCoins,
    href: "/dashboard/cetak/persembahan-bulanan",
  },
  {
    title: "Rekap Persembahan Tahunan",
    description:
      "Cetak ringkasan persembahan selama satu tahun berdasarkan bulan dan blok.",
    icon: BarChart3,
    href: "/dashboard/cetak/persembahan-tahunan",
  },
  {
    title: "Data Jemaat",
    description: "Cetak daftar data jemaat berdasarkan blok.",
    icon: Users,
    href: "/dashboard/cetak/data-jemaat",
  },
];

export default function CetakClient() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
          <Printer size={22} />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cetak Laporan</h1>

          <p className="text-sm text-gray-500">
            Pilih jenis laporan yang ingin dicetak.
          </p>
        </div>
      </div>

      {/* REPORT CARDS */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;

          return (
            <button
              key={report.href}
              type="button"
              onClick={() => router.push(report.href)}
              className="group text-left"
            >
              <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-md">
                {/* ICON */}
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition group-hover:bg-orange-600 group-hover:text-white">
                    <Icon size={23} />
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition group-hover:bg-orange-50 group-hover:text-orange-600">
                    <ChevronRight size={20} />
                  </div>
                </div>

                {/* CONTENT */}
                <div className="mt-6">
                  <h2 className="text-base font-bold text-gray-900">
                    {report.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {report.description}
                  </p>
                </div>

                {/* ACTION */}
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-orange-600">
                  <Printer size={17} />

                  <span>Pilih Laporan</span>

                  <ChevronRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* INFORMATION */}
      <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Printer size={19} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">Pusat Cetak Laporan</h3>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              Gunakan halaman ini untuk memilih laporan yang ingin dicetak.
              Setiap laporan memiliki filter dan format cetak tersendiri.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

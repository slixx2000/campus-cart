import Link from "next/link";
import Image from "next/image";

export default function NotFoundState() {
  return (
    <section className="relative overflow-hidden px-6 py-12 md:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10 dark:fluid-gradient-dark" />
      <div className="pointer-events-none absolute -left-24 -top-20 h-72 w-72 rounded-full bg-primary/15 blur-[90px] dark:bg-sky-300/10" />
      <div className="pointer-events-none absolute -bottom-20 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-[100px] dark:bg-cyan-300/10" />

      <div className="mx-auto max-w-3xl text-center">
        <div className="relative mx-auto mb-8 w-full max-w-xl rounded-3xl border border-white/50 bg-white/75 p-8 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[120px] font-black text-primary/10">
            404
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-7xl text-primary md:text-8xl">
              school
            </span>
            <div className="rounded-2xl border-4 border-white shadow-lg dark:border-slate-700">
                <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAE2j0j8h2KVMwoWd4Cb6ICWqE63ow8ZwwwDMGXBnQDTuMMIrBLUth6lfYchtdDEBdCp8aTxCaFcxcLhnI2ilBtLV5vHxuazdfugc5D6tH3GCTDzQ-02Vx2G6vgVGLHtWJXMFFDLJvyERz8hIQ_zBWnFDvuVk_G_2weSpRl_qycb1JhYULMG3mmxiU6IQL_OfvBevfHr6hfG_5tNXXdTNI-1piuw_syfmaHeZ3klFGQ9qIOJf8hf9q2RTHLhTuIVfR8bnXk8SdQqho"
                alt="Empty dorm room illustration"
                  width={256}
                  height={256}
                  unoptimized
                className="h-52 w-52 rounded-xl object-cover md:h-64 md:w-64"
              />
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
          Oops! This page is off-campus.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 md:text-lg">
          We could not find what you were looking for. It may have been removed or moved to
          another listing path.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:shadow-primary/50 dark:bg-gradient-to-r dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950 dark:shadow-sky-400/25"
          >
            <span className="material-symbols-outlined text-lg">storefront</span>
            Back to Marketplace
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            Go Home
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 border-t border-slate-200 pt-6 text-sm font-semibold text-primary dark:border-slate-800">
          <Link href="/about" className="inline-flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined text-base">support_agent</span>
            Help Center
          </Link>
          <Link href="/browse" className="inline-flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined text-base">explore</span>
            Browse Items
          </Link>
        </div>
      </div>
    </section>
  );
}

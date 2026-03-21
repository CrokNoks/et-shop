import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Logo width={300} height={100} />
        
        <h1 className="text-2xl font-bold text-[#1A365D]">
          Gérez vos listes de courses en toute simplicité.
        </h1>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <button className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-[#FF6B35] text-white gap-2 hover:bg-[#e55a2b] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 font-bold">
            Commencer une liste
          </button>
          <button className="rounded-full border border-solid border-[#1A365D] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 text-[#1A365D]">
            Voir mes listes
          </button>
        </div>
      </main>
      
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-[#1A365D] opacity-70">
        <p>© 2026 Et SHop! - Votre compagnon de courses propulsionné</p>
      </footer>
    </div>
  );
}

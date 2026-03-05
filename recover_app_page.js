const fs = require('fs');
const content = import Link from "next/link";
import { User, Download, Link2, Plus, Search, Filter, Layers, Tags, EyeOff } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase.from('user_books').select('*, books(*, authors(*))');
  if (user) {
    query = query.eq('user_id', user.id);
  }
  const { data: userBooks, error } = await query;
  
  const booksToDisplay = userBooks || [];

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-normal mb-8">Цокольный этаж</h1>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Книга, автор, серия или ссылка"
              className="w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500"
            />
            <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 border-b pb-4">
            <Link href="#" className="text-gray-900 border-b-2 border-transparent hover:border-gray-300">Главная</Link>
            <Link href="#" className="text-gray-900 border-b-2 border-transparent hover:border-gray-300">Мои книги</Link>
            <Link href="#" className="text-gray-900 border-b-2 border-transparent hover:border-gray-300">Boosty Shared</Link>
            <button className="flex items-center gap-1">Еще ▾</button>
            <div className="flex-1"></div>
            <Link href="#" className="text-gray-900 border-b-2 border-transparent hover:border-gray-300">Профиль</Link>
          </div>
        </div>

        {/* Filters & Toggles */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex border border-blue-500 rounded-md overflow-hidden">
            <button className="bg-blue-600 text-white px-4 py-1.5 text-sm">Обновления</button>
            <button className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-1.5 text-sm">Популярное</button>
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          <button className="p-1.5 border rounded text-blue-500 hover:bg-blue-50"><Filter className="w-4 h-4" /></button>
          <button className="p-1.5 border rounded text-blue-500 hover:bg-blue-50"><Layers className="w-4 h-4" /></button>
          <button className="p-1.5 border rounded text-blue-500 hover:bg-blue-50"><Tags className="w-4 h-4" /></button>
          <button className="p-1.5 border rounded text-blue-500 hover:bg-blue-50"><EyeOff className="w-4 h-4" /></button>
        </div>

        {/* Books List */}
        <div className="space-y-8 mb-12">
          {booksToDisplay.map((ub: any) => {
            const bookItem = ub.books;
            if (!bookItem) return null;
            const primaryAuthor = bookItem.authors?.[0]?.name || "Unknown Author";
            
            return (
            <div key={ub.id || bookItem.id} className="flex flex-col gap-1.5">
              <h2 className="text-base font-semibold">
                <Link href={"/book/" + bookItem.id} className="hover:text-blue-600">{bookItem.title}</Link>
              </h2>
              <div className="flex items-center gap-1 text-sm text-gray-700">
                <User className="w-3 h-3" />
                <span>{primaryAuthor}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Layers className="w-3 h-3" />
                <span>{"Series Name • " + (bookItem.published_year || "1")}</span>
              </div>
              <div className="text-xs text-gray-500">
                Космическая фантастика, Юмористическая фантастика, Боевая фантастика
              </div>

              {ub.status === 'reading' && (
                <div className="mt-1 mb-1">
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                    Глава 2. Стальные почести
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mt-1 mb-2 text-xs">
                {ub.status === 'reading' ? (
                   <span className="text-gray-500">в процессе</span>
                ) : (
                   <span className="bg-green-600 text-white px-1.5 py-0.5 rounded">весь текст</span>
                )}
                <span className="flex items-center gap-1 text-gray-500"><User className="w-3 h-3" /> 19</span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <Link
                  href={"/read/" + bookItem.id}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-md"
                >
                  Читать
                </Link>
                <button className="border text-gray-700 hover:bg-gray-50 text-sm px-4 py-1.5 rounded-md flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Добавить ▾
                </button>
                <button className="border p-1.5 rounded-md text-gray-500 hover:bg-gray-50">
                  <Download className="w-4 h-4" />
                </button>
                <button className="border p-1.5 rounded-md text-gray-500 hover:bg-gray-50">
                  <Link2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )})}
        </div>

      </div>
    </div>
  );
};
fs.writeFileSync('app/page.tsx', content);
console.log('done via node');

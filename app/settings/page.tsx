import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-4 md:px-8 shadow-sm">
        <Link href="/" className="text-xl font-bold text-gray-900 mr-12 tracking-tight">OpenBookshelf</Link>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">Library</Link>
            <Link href="/connections" className="text-gray-500 hover:text-gray-900 transition-colors">Connections</Link>
            <Link href="/settings" className="text-blue-600 font-semibold">Settings</Link>
        </nav>
      </header>

      <main className="pt-24 px-4 md:px-8 pb-12 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
        <p className="text-gray-500">Settings implementation coming soon.</p>
      </main>
    </div>
  );
}

import Link from "next/link";
import { Compass, Search, Globe, Library } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DiscoverPage() {
  const catalogs = [
    {
      id: "gutenberg",
      name: "Project Gutenberg",
      description: "Over 70,000 free eBooks in multiple languages.",
      url: "https://m.gutenberg.org/ebooks.opds/",
      language: "Multilingual"
    },
    {
      id: "standardebooks",
      name: "Standard Ebooks",
      description: "High quality, carefully formatted open source eBooks.",
      url: "https://standardebooks.org/opds/all",
      language: "English"
    },
    {
      id: "feedbooks",
      name: "Feedbooks Public Domain",
      description: "Public domain books formatted for mobile devices.",
      url: "https://catalog.feedbooks.com/publicdomain/catalog.atom",
      language: "Multilingual"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-3 mb-8">
          <Compass className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Discover</h1>
            <p className="text-gray-500">Browse free, public OPDS catalogs from around the world.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalogs.map((catalog) => (
            <Card key={catalog.id} className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {catalog.language}
                  </span>
                </div>
                <CardTitle className="mt-4">{catalog.name}</CardTitle>
                <CardDescription>{catalog.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4 flex gap-2">
                <Button className="w-full" asChild>
                   <Link href={`/discover/browse?url=${encodeURIComponent(catalog.url)}`}>
                      Browse
                   </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

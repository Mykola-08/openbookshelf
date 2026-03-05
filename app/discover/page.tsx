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
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto space-y-10 p-4 md:p-8">
        <div className="flex items-end justify-between border-b pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Compass className="w-8 h-8 text-primary" />
              Discover
            </h1>
            <p className="text-sm text-muted-foreground">Browse free, public OPDS catalogs from around the world.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalogs.map((catalog) => (
            <Card key={catalog.id} className="hover:shadow-md transition-all flex flex-col rounded-2xl bg-card border border-border/60">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-muted rounded-xl text-primary shadow-sm border border-border/20">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium px-2 py-1 bg-secondary text-secondary-foreground rounded-full tracking-wider uppercase">
                    {catalog.language}
                  </span>
                </div>
                <CardTitle className="mt-4 text-xl tracking-tight">{catalog.name}</CardTitle>
                <CardDescription className="text-sm">{catalog.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4 pb-5 flex gap-2">
                <Button className="w-full rounded-xl" asChild>
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

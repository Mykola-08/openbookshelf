import Link from "next/link";
import { BookOpen, Home, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-background">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-muted-foreground" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Page not found</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
            Check the URL or try one of the links below.
          </p>
        </div>

        {/* Recovery links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Library
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/discover">
              <Compass className="w-4 h-4 mr-2" />
              Discover Books
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/search">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

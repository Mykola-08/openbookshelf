"use client";

import { useEffect, useRef, useState } from "react";
import { ReactReader, ReactReaderStyle } from "react-reader";

// Customize ReactReader styles
const customStyles = {
  ...ReactReaderStyle,
  readerArea: {
    ...ReactReaderStyle.readerArea,
    backgroundColor: '#fff',
    transition: undefined
  }
};

interface EpubReaderProps {
  url: string;
  location?: string | number | null;
  locationChanged?: (loc: string | number) => void;
  title?: string;
  theme?: "light" | "dark" | "sepia";
  fontSize?: number;
}

export function EpubReader({ url, location, locationChanged, title }: EpubReaderProps) {
  // Use a state to force re-render on resize if needed or handle themes
  const [size, setSize] = useState(100);
  const renditionRef = useRef<any>(null);

  useEffect(() => {
     // Persist location logic here if needed
  }, [location]);

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      <ReactReader
        url={url}
        title={title || "Book Reader"}
        location={location ?? null}
        locationChanged={(epubcifi: string) => {
             if (locationChanged) locationChanged(epubcifi);
        }}
        getRendition={(rendition) => {
            renditionRef.current = rendition;
            rendition.themes.fontSize(`${size}%`);
        }}
        epubOptions={{
            flow: "paginated",
            manager: "default"
        }}
        readerStyles={customStyles}
      />
      
      {/* Reader Controls Overlay */}
      <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded shadow flex gap-2">
         <button onClick={() => { 
             setSize(s => Math.max(80, s - 10)); 
             renditionRef.current?.themes.fontSize(`${Math.max(80, size - 10)}%`);
         }} className="w-8 h-8 flex items-center justify-center border rounded">A-</button>
         <span className="flex items-center text-sm">{size}%</span>
         <button onClick={() => { 
             setSize(s => Math.min(200, s + 10)); 
             renditionRef.current?.themes.fontSize(`${Math.min(200, size + 10)}%`);
         }} className="w-8 h-8 flex items-center justify-center border rounded">A+</button>
      </div>
    </div>
  );
}

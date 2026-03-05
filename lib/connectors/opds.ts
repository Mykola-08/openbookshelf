// OPDS Parser Implementation (XML -> JSON)

export interface OPDSEntry {
    id: string;
    title: string;
    updated: string;
    authors: { name: string; uri?: string }[];
    content: string;
    summary?: string;
    links: { rel: string; href: string; type: string }[];
    category?: { term: string; scheme?: string; label?: string }[];
}

export interface OPDSFeed {
  id: string;
  title: string;
  updated: string;
  links: { rel: string; href: string; type: string }[];
  entries: OPDSEntry[];
  nextPage?: string;
  searchLink?: string;
}

export async function parseOPDS(xmlData: string): Promise<OPDSFeed> {
  const { XMLParser } = await import('fast-xml-parser');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });

  const parsed = parser.parse(xmlData);
  const feed = parsed.feed;

  if (!feed) {
    throw new Error("Invalid OPDS Feed");
  }

  const entriesRaw = Array.isArray(feed.entry) ? feed.entry : [feed.entry || []].flat();

  const entries: OPDSEntry[] = entriesRaw.map((entry: any) => ({
    id: entry.id,
    title: entry.title,
    updated: entry.updated,
    authors: Array.isArray(entry.author) ? entry.author.map((a: any) => ({
        name: a.name,
        uri: a.uri
    })) : [{ name: entry.author?.name, uri: entry.author?.uri }],
    content: entry.content?.["#text"] || entry.content,
    summary: entry.summary?.["#text"] || entry.summary,
    links: Array.isArray(entry.link) ? entry.link.map((l: any) => ({
        rel: l["@_rel"],
        href: l["@_href"],
        type: l["@_type"],
        title: l["@_title"]
    })) : [],
    category: Array.isArray(entry.category) ? entry.category.map((c: any) => ({
        term: c["@_term"],
        scheme: c["@_scheme"],
        label: c["@_label"]
    })) : []
  }));

  const linksRaw = Array.isArray(feed.link) ? feed.link : [feed.link || []].flat();
  const nextLink = linksRaw.find((l: any) => l["@_rel"] === "next");
  const searchLink = linksRaw.find((l: any) => l["@_rel"] === "search" && l["@_type"] === "application/opensearchdescription+xml");

  return {
    id: feed.id,
    title: feed.title,
    updated: feed.updated,
    links: linksRaw.map((l: any) => ({
        rel: l["@_rel"],
        href: l["@_href"],
        type: l["@_type"]
    })),
    entries,
    nextPage: nextLink?.["@_href"],
    searchLink: searchLink?.["@_href"]
  };
}

export async function fetchOPDSFeed(url: string): Promise<OPDSFeed> {
  // Use a proxy if tackling CORS issues (common with OPDS from browser)
  // For server-side sync, direct fetch is fine.
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch OPDS: ${res.statusText}`);
    const text = await res.text();
    return parseOPDS(text);
  } catch (e) {
    console.error("OPDS Fetch Error", e);
    throw e;
  }
}

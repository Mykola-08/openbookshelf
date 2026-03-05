import sys

with open('components/Navbar.tsx', 'r', encoding='utf-8') as f:
    orig = f.read()

# Importer line
if 'import { useUserSettings }' not in orig:
    orig = orig.replace('import { useModules } from "@/lib/hooks/use-modules";', 
                        'import { useModules } from "@/lib/hooks/use-modules";\nimport { useUserSettings } from "@/lib/hooks/use-user-settings";')

# Icon
if 'Globe' not in orig:
    orig = orig.replace('Search, ChevronDown', 'Search, ChevronDown, Globe')

# Hook call
if 'const { settings } = useUserSettings();' not in orig:
    orig = orig.replace('const { flags } = useFeatureFlags();', 
                        'const { flags } = useFeatureFlags();\n  const { settings } = useUserSettings();')

# Link injection
link_code = """
        {settings.enableCommunity && (
          <Link
            href="/community"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
              pathname.startsWith('/community') ? "bg-accent/60 text-accent-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            )}
          >
            <Globe className="w-4 h-4" />
            Community
          </Link>
        )}
"""
if 'href="/community"' not in orig:
    orig = orig.replace('</header>', link_code + '      </nav>\n    </header>')

    # cleanup duplicate </nav> because we injected it before </header>
    orig = orig.replace('      </nav>\n' + link_code, link_code)
    # wait a safer way:
    orig = orig.replace('</nav>\n</header>', '</nav>\n    </header>') # just normalize
    orig = orig.replace('</nav>\n    </header>', link_code + '      </nav>\n    </header>')

with open('components/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(orig)


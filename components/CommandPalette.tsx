"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Calculator, Calendar, CreditCard, Settings, Smile, User, Search, BookOpen, Globe } from "lucide-react"
import { useUserSettings } from "@/lib/hooks/use-user-settings"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { settings } = useUserSettings()

  React.useEffect(() => {
    if (!settings.enableCommandPalette) return
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [settings.enableCommandPalette])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  const [searchInput, setSearchInput] = React.useState("")

  if (!settings.enableCommandPalette) return null

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search books, navigate, or type a command..." 
          value={searchInput}
          onValueChange={setSearchInput}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Quick search action */}
          {searchInput.trim() && (
            <CommandGroup heading="Search">
              <CommandItem onSelect={() => runCommand(() => router.push(`/search?q=${encodeURIComponent(searchInput)}`))}>
                <Search className="mr-2 h-4 w-4" />
                <span>Search &ldquo;{searchInput}&rdquo; across all sources</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push(`/search?q=${encodeURIComponent(searchInput)}&field=title`))}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Search titles for &ldquo;{searchInput}&rdquo;</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push(`/search?q=${encodeURIComponent(searchInput)}&field=author`))}>
                <User className="mr-2 h-4 w-4" />
                <span>Search authors for &ldquo;{searchInput}&rdquo;</span>
              </CommandItem>
            </CommandGroup>
          )}

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
              <Calculator className="mr-2 h-4 w-4" />
              <span>Library</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/discover"))}>
              <Smile className="mr-2 h-4 w-4" />
              <span>Discover</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/tracker"))}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Progress</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => runCommand(() => router.push("/connections"))}>
              <User className="mr-2 h-4 w-4" />
              <span>Connections</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

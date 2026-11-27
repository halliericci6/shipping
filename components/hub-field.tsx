"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { HUBS, getHub, hubPlace } from "@/lib/hubs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const ordered = [...HUBS].sort((a, b) => a.state.localeCompare(b.state) || a.city.localeCompare(b.city))

export function HubField({
  label,
  hubId,
  onChange,
}: {
  label: string
  hubId: string
  onChange: (id: string) => void
}) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const sheetInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlight, setHighlight] = useState(0)
  const selected = getHub(hubId)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ordered
    return ordered.filter((hub) => `${hub.city} ${hub.state} ${hub.yard}`.toLowerCase().includes(q))
  }, [query])

  const active = Math.min(highlight, Math.max(matches.length - 1, 0))

  useEffect(() => {
    if (!open) return
    const narrow = window.matchMedia("(max-width: 1023px)").matches
    if (narrow) {
      const previous = document.body.style.overflow
      document.body.style.overflow = "hidden"
      sheetInputRef.current?.focus()
      return () => {
        document.body.style.overflow = previous
      }
    }
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    return () => document.removeEventListener("pointerdown", onPointer)
  }, [open])

  function choose(id: string) {
    onChange(id)
    setOpen(false)
    setQuery("")
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setOpen(true)
      setHighlight((index) => Math.min(index + 1, matches.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlight((index) => Math.max(index - 1, 0))
    } else if (event.key === "Enter" && open && matches[active]) {
      event.preventDefault()
      choose(matches[active].id)
    } else if (event.key === "Escape") {
      setOpen(false)
    }
  }

  const options = (
    <ul id={`${listId}-list`} role="listbox" className="min-h-0 flex-1 overflow-auto p-1 lg:max-h-64">
      {matches.length === 0 ? (
        <li className="px-3 py-3 text-sm text-muted-foreground">No city matches that.</li>
      ) : (
        matches.map((hub, index) => (
          <li key={hub.id} role="presentation">
            <button
              id={`${listId}-${hub.id}`}
              type="button"
              role="option"
              aria-selected={hub.id === hubId}
              className={cn(
                "flex min-h-12 w-full flex-col justify-center rounded-lg px-3 py-2 text-left",
                index === active ? "bg-accent" : "hover:bg-muted",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => choose(hub.id)}
            >
              <span className="text-base font-medium lg:text-sm">
                {hub.city}, {hub.state}
              </span>
              <span className="text-sm text-muted-foreground lg:text-xs">{hub.yard}</span>
            </button>
          </li>
        ))
      )}
    </ul>
  )

  return (
    <div ref={rootRef} className="relative grid gap-1.5">
      <Label id={`${listId}-label`}>{label}</Label>
      <button
        id={`${listId}-button`}
        type="button"
        className="flex h-12 w-full items-center rounded-lg border border-input bg-transparent px-3 text-left text-base lg:hidden"
        aria-labelledby={`${listId}-label`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${listId}-list`}
        onClick={() => {
          setQuery("")
          setHighlight(0)
          setOpen(true)
        }}
      >
        {selected ? hubPlace(selected) : <span className="text-muted-foreground">City or yard</span>}
      </button>
      {selected && !open ? <p className="text-sm text-muted-foreground lg:hidden">{selected.yard}</p> : null}

      <Input
        id={listId}
        role="combobox"
        aria-labelledby={`${listId}-label`}
        aria-expanded={open}
        aria-controls={`${listId}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${listId}-${matches[active].id}` : undefined}
        autoComplete="off"
        placeholder="City or yard"
        className="hidden h-12 lg:block"
        value={open ? query : selected ? hubPlace(selected) : ""}
        onFocus={() => {
          setOpen(true)
          setQuery("")
          setHighlight(0)
        }}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setHighlight(0)
        }}
        onKeyDown={onKeyDown}
      />
      {selected && !open ? <p className="hidden text-xs text-muted-foreground lg:block">{selected.yard}</p> : null}

      {open ? (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex flex-col bg-card lg:absolute lg:inset-x-0 lg:top-full lg:bottom-auto lg:z-30 lg:mt-1 lg:max-h-64 lg:rounded-xl lg:border lg:border-border lg:bg-popover lg:shadow-md">
          <div className="flex items-center gap-2 border-b border-border p-3 lg:hidden">
            <Input
              ref={sheetInputRef}
              value={query}
              autoComplete="off"
              placeholder="Search cities"
              aria-label={`Search ${label.toLowerCase()}`}
              className="h-12"
              onChange={(event) => {
                setQuery(event.target.value)
                setHighlight(0)
              }}
              onKeyDown={onKeyDown}
            />
            <Button type="button" variant="outline" className="h-12 shrink-0" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
          {options}
        </div>
      ) : null}
    </div>
  )
}

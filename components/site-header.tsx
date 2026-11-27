"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Mark } from "@/components/mark"
import { shell } from "@/components/shell"

const links = [
  { href: "/quote", label: "Request a quote", short: "Request" },
  { href: "/shipments", label: "Haul board", short: "Board" },
]

export function SiteHeader() {
  const pathname = usePathname()
  return <HeaderBar pathname={pathname} />
}

export function HeaderFallback() {
  return <HeaderBar pathname="" />
}

function HeaderBar({ pathname }: { pathname: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink text-cream">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-cream focus:px-3 focus:py-2 focus:text-ink"
      >
        Skip to the desk
      </a>
      <div className={`${shell} flex h-16 items-center justify-between gap-4`}>
        <Link href="/" className="flex items-center gap-2.5 text-cream">
          <Mark className="size-7 text-brass" />
          <span className="leading-tight">
            <span className="block font-heading text-lg tracking-tight">Barnbound</span>
            <span className="block text-[0.65rem] tracking-[0.16em] text-cream/60 uppercase">
              Horse shipping
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Desk">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-cream/75 transition-colors hover:bg-white/10 hover:text-cream",
                  active && "bg-white/10 text-brass",
                )}
              >
                <span className="sm:hidden">{link.short}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

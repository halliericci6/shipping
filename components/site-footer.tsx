import { shell } from "@/components/shell"

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className={`${shell} flex flex-col gap-2 py-8 text-sm text-muted-foreground sm:flex-row sm:items-end sm:justify-between`}>
        <div>
          <p className="font-heading text-lg text-foreground">Barnbound</p>
          <p>Horse shipping between show yards.</p>
        </div>
        <p className="max-w-sm sm:text-right">
          Quotes are hub-to-hub estimates. Hauls you book stay in this browser.
        </p>
      </div>
    </footer>
  )
}

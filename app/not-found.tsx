import Link from "next/link"
import { shell } from "@/components/shell"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <div className={`${shell} py-20`}>
      <p className="text-xs tracking-[0.18em] text-brass-deep uppercase">Missing page</p>
      <h1 className="mt-2 font-heading text-4xl tracking-tight">That page is not on the desk.</h1>
      <Link href="/" className={cn(buttonVariants(), "mt-6 inline-flex h-10")}>
        Back to Barnbound
      </Link>
    </div>
  )
}

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ----- Tabs Root -----
interface TabsContextValue {
  active: string
  setActive: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue>({
  active: "",
  setActive: () => {},
})

export function Tabs({
  defaultValue,
  className,
  children,
  ...props
}: {
  defaultValue: string
  className?: string
  children: React.ReactNode
}) {
  const [active, setActive] = React.useState(defaultValue)

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

// ----- TabsList -----
export function TabsList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ----- TabsTrigger -----
export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ value, className, ...props }, ref) => {
  const { active, setActive } = React.useContext(TabsContext)

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setActive(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active === value
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-background/50",
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = "TabsTrigger"

// ----- TabsContent -----
export const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ value, className, ...props }, ref) => {
  const { active } = React.useContext(TabsContext)

  if (active !== value) return null

  return <div ref={ref} className={cn("mt-2", className)} {...props} />
})
TabsContent.displayName = "TabsContent"
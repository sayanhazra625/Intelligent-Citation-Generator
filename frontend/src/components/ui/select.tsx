"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
}

const SelectContext = React.createContext<SelectContextValue>({
  value: "",
  onValueChange: () => {},
})

// ----- Select Root -----
export function Select({
  children,
  value,
  defaultValue,
  onValueChange,
}: {
  children: React.ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const currentValue = value !== undefined ? value : internalValue
  const handleChange = React.useCallback(
    (val: string) => {
      setInternalValue(val)
      onValueChange?.(val)
    },
    [onValueChange]
  )

  return (
    <SelectContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

// ----- Trigger -----
export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

// ----- SelectValue (placeholder) -----
export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext)
  return <span className="truncate">{value || placeholder || ""}</span>
}

// ----- SelectContent (renders a native <select>) -----
// We convert the declarative SelectItem children into native <option> elements.
// This is the simplest reliable approach that avoids all cloneElement/portal problems.
export function SelectContent({ children }: { children: React.ReactNode }) {
  const { value, onValueChange } = React.useContext(SelectContext)

  // Walk children to extract value/label pairs from SelectItem components
  const options: { value: string; label: React.ReactNode }[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<{ value: string; children: React.ReactNode }>(child)) {
      options.push({ value: child.props.value, label: child.props.children })
    }
  })

  return (
    <select
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="" disabled>
        Select...
      </option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {typeof opt.label === "string" ? opt.label : opt.value}
        </option>
      ))}
    </select>
  )
}

// ----- SelectItem (declarative only, consumed by SelectContent) -----
export const SelectItem = React.forwardRef<
  HTMLDivElement,
  { value: string; children: React.ReactNode }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ value, children, ...props }, ref) => {
  // This component is declarative-only; it is read by SelectContent above.
  return null
})
SelectItem.displayName = "SelectItem"

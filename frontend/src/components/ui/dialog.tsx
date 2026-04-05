"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ----- Dialog Root -----
export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {/* DialogContent will render here via portal-less approach */}
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

interface DialogContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue>({
  isOpen: false,
  setIsOpen: () => {},
})

// ----- DialogTrigger -----
export function DialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactNode
}) {
  const { setIsOpen } = React.useContext(DialogContext)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        (children as any).props?.onClick?.(e)
        setIsOpen(true)
      },
    })
  }

  return <button onClick={() => setIsOpen(true)}>{children}</button>
}

// ----- DialogContent -----
export function DialogContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen, setIsOpen } = React.useContext(DialogContext)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={() => setIsOpen(false)} />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg bg-background p-6 shadow-lg sm:rounded-lg border",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

// ----- DialogHeader -----
export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
}

// ----- DialogFooter -----
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4", className)} {...props} />
}

// ----- DialogTitle -----
export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
DialogTitle.displayName = "DialogTitle"

// ----- DialogDescription -----
export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
DialogDescription.displayName = "DialogDescription"
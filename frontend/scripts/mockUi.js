const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'src', 'components', 'ui');

if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

const mocks = {
  'toast.tsx': `import * as React from "react"
export const Toast = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
export const ToastAction = React.forwardRef<HTMLButtonElement, any>((props, ref) => <button ref={ref} {...props} />)
export const ToastClose = React.forwardRef<HTMLButtonElement, any>((props, ref) => <button ref={ref} {...props} />)
export const ToastTitle = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
export const ToastDescription = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
export const ToastProvider = ({ children }: any) => <>{children}</>
export const ToastViewport = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)`,

  'use-toast.ts': `import { useState } from "react"
export const useToast = () => {
  const [toasts, setToasts] = useState<any[]>([])
  const toast = (props: any) => { 
    console.log("Toast:", props);
    // basic alert fallback for missing toaster UI in demo mode
    if (typeof window !== "undefined") alert(props.title + (props.description ? ": " + props.description : ""));
  }
  return { toast, toasts, dismiss: () => {} }
}`,

  'toaster.tsx': `export function Toaster() { return null; }`,

  'dropdown-menu.tsx': `import * as React from "react"
export const DropdownMenu = ({ children }: any) => <div className="relative inline-block">{children}</div>
export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, any>((props, ref) => <button ref={ref} {...props} />)
export const DropdownMenuContent = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} className="absolute right-0 mt-2 w-56 bg-background rounded-md shadow-lg border p-1 z-50" {...props} />)
export const DropdownMenuItem = React.forwardRef<HTMLDivElement, any>(({ asChild, ...props }, ref) => asChild ? <div ref={ref} {...props} /> : <div ref={ref} className="px-2 py-1.5 text-sm hover:bg-muted cursor-pointer rounded-sm" {...props} />)
export const DropdownMenuLabel = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} className="px-2 py-1.5 text-sm font-semibold" {...props} />)
export const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} className="h-px bg-muted my-1" {...props} />)`,

  'form.tsx': `import * as React from "react"
import { Controller } from "react-hook-form"
export const Form = ({ children, ...props }: any) => <div {...props}>{children}</div>
export const FormField = Controller
export const FormItem = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} className="space-y-2" {...props} />)
export const FormLabel = React.forwardRef<HTMLLabelElement, any>((props, ref) => <label ref={ref} className="text-sm font-medium" {...props} />)
export const FormControl = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
export const FormDescription = React.forwardRef<HTMLParagraphElement, any>((props, ref) => <p ref={ref} className="text-[0.8rem] text-muted-foreground" {...props} />)
export const FormMessage = React.forwardRef<HTMLParagraphElement, any>((props, ref) => <p ref={ref} className="text-[0.8rem] font-medium text-destructive" {...props} />)`,

  'select.tsx': `import * as React from "react"
export const Select = ({ children, value, onValueChange, defaultValue }: any) => {
  return React.cloneElement(children, { value: value || defaultValue, onChange: (e: any) => onValueChange?.(e.target.value) })
}
export const SelectTrigger = React.forwardRef<HTMLButtonElement, any>((props, ref) => <div className="border border-input rounded flex items-center">{props.children || <button ref={ref} {...props} />}</div>)
export const SelectValue = React.forwardRef<HTMLSpanElement, any>((props, ref) => <span ref={ref} {...props} />)
export const SelectContent = ({ children }: any) => <>{children}</>
export const SelectItem = React.forwardRef<HTMLOptionElement, any>(({ value, children }, ref) => <option ref={ref} value={value}>{children}</option>)
// Real quick override to make generic selects work with simple HTML select
export const SimpleSelect = ({ value, onValueChange, children, ...props }: any) => (
  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={value} onChange={(e) => onValueChange(e.target.value)} {...props}>
    {children}
  </select>
)
`,

  'table.tsx': `import * as React from "react"
export const Table = React.forwardRef<HTMLTableElement, any>((props, ref) => <div className="w-full overflow-auto"><table ref={ref} className="w-full caption-bottom text-sm" {...props} /></div>)
export const TableHeader = React.forwardRef<HTMLTableSectionElement, any>((props, ref) => <thead ref={ref} className="[&_tr]:border-b" {...props} />)
export const TableBody = React.forwardRef<HTMLTableSectionElement, any>((props, ref) => <tbody ref={ref} className="[&_tr:last-child]:border-0" {...props} />)
export const TableRow = React.forwardRef<HTMLTableRowElement, any>((props, ref) => <tr ref={ref} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted" {...props} />)
export const TableHead = React.forwardRef<HTMLTableCellElement, any>((props, ref) => <th ref={ref} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground" {...props} />)
export const TableCell = React.forwardRef<HTMLTableCellElement, any>((props, ref) => <td ref={ref} className="p-4 align-middle" {...props} />)`,

  'dialog.tsx': `import * as React from "react"
export const Dialog = ({ open, onOpenChange, children }: any) => open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">{children}</div> : null
export const DialogTrigger = React.forwardRef<HTMLButtonElement, any>(({ asChild, onClick, ...props }, ref) => asChild ? React.cloneElement(props.children, { onClick }) : <button ref={ref} onClick={onClick} {...props} />)
export const DialogContent = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} className="relative z-50 w-full max-w-lg bg-background p-6 shadow-lg sm:rounded-lg" {...props} />)
export const DialogHeader = ({ className, ...props }: any) => <div className="flex flex-col space-y-1.5 text-center sm:text-left" {...props} />
export const DialogFooter = ({ className, ...props }: any) => <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2" {...props} />
export const DialogTitle = React.forwardRef<HTMLHeadingElement, any>((props, ref) => <h2 ref={ref} className="text-lg font-semibold leading-none tracking-tight" {...props} />)
export const DialogDescription = React.forwardRef<HTMLParagraphElement, any>((props, ref) => <p ref={ref} className="text-sm text-muted-foreground" {...props} />)`,

  'tabs.tsx': `import * as React from "react"
export const Tabs = ({ defaultValue, children }: any) => {
  const [active, setActive] = React.useState(defaultValue)
  return <div className="w-full">{React.Children.map(children, child => React.cloneElement(child, { active, setActive }))}</div>
}
export const TabsList = ({ active, setActive, children, ...props }: any) => <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground" {...props}>{React.Children.map(children, child => React.cloneElement(child, { active, setActive }))}</div>
export const TabsTrigger = React.forwardRef<HTMLButtonElement, any>(({ value, active, setActive, ...props }, ref) => <button ref={ref} onClick={() => setActive?.(value)} className={\`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium \${active === value ? "bg-background text-foreground shadow-sm" : ""}\`} {...props} />)
export const TabsContent = React.forwardRef<HTMLDivElement, any>(({ value, active, ...props }, ref) => active === value ? <div ref={ref} {...props} /> : null)`,

  'alert-dialog.tsx': `export const AlertDialog = ({ children }: any) => <>{children}</>`,
  
  'skeleton.tsx': `export const Skeleton = ({ className, ...props }: any) => <div className={\`animate-pulse rounded-md bg-muted \${className}\`} {...props} />`,
  
  'switch.tsx': `export const Switch = (props: any) => <input type="checkbox" {...props} />`,
  
  'textarea.tsx': `import * as React from "react"
export const Textarea = React.forwardRef<HTMLTextAreaElement, any>((props, ref) => <textarea ref={ref} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" {...props} />)`,
  
  'badge.tsx': `export const Badge = ({ children, className }: any) => <span className={\`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold \${className}\`}>{children}</span>`,
  
  'avatar.tsx': `import * as React from "react"
export const Avatar = React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => <div ref={ref} className={\`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full \${className}\`} {...props} />)
export const AvatarImage = React.forwardRef<HTMLImageElement, any>((props, ref) => <img ref={ref} className="aspect-square h-full w-full" {...props} />)
export const AvatarFallback = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} className="flex h-full w-full items-center justify-center rounded-full bg-muted" {...props} />)`
};

Object.keys(mocks).forEach(file => {
  const filePath = path.join(componentsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, mocks[file]);
    console.log("Created mock for", file);
  } else {
    console.log("Skipping", file, "as it already exists.");
  }
});

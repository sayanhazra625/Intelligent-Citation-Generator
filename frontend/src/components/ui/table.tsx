import * as React from "react"
export const Table = React.forwardRef<HTMLTableElement, any>((props, ref) => <div className="w-full overflow-auto"><table ref={ref} className="w-full caption-bottom text-sm" {...props} /></div>)
export const TableHeader = React.forwardRef<HTMLTableSectionElement, any>((props, ref) => <thead ref={ref} className="[&_tr]:border-b" {...props} />)
export const TableBody = React.forwardRef<HTMLTableSectionElement, any>((props, ref) => <tbody ref={ref} className="[&_tr:last-child]:border-0" {...props} />)
export const TableRow = React.forwardRef<HTMLTableRowElement, any>((props, ref) => <tr ref={ref} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted" {...props} />)
export const TableHead = React.forwardRef<HTMLTableCellElement, any>((props, ref) => <th ref={ref} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground" {...props} />)
export const TableCell = React.forwardRef<HTMLTableCellElement, any>((props, ref) => <td ref={ref} className="p-4 align-middle" {...props} />)
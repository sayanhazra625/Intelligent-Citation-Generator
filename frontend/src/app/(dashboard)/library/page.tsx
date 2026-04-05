"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Copy, Trash2, Search, Download } from "lucide-react";
import axiosInstance from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LibraryPage() {
  const { toast } = useToast();
  
  const [citations, setCitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [style, setStyle] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchCitations = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");
      if (search) params.append("search", search);
      if (style !== "all") params.append("style", style);

      const { data } = await axiosInstance.get(`/citations?${params.toString()}`);
      if (data.success) {
        setCitations(data.data);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
      }
    } catch (error) {
      toast({ title: "Failed to load library", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchCitations();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, style, page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this citation?")) return;
    try {
      await axiosInstance.delete(`/citations/${id}`);
      setCitations(citations.filter((c) => c._id !== id));
      setTotalItems((prev) => prev - 1);
      toast({ title: "Citation deleted" });
    } catch (error) {
      toast({ title: "Deletion failed", variant: "destructive" });
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const handleExport = async (formatType: string) => {
    if (citations.length === 0) return toast({ title: "Nothing to export" });
    try {
      // Export current page for now, or you could export all by fetching them without pagination
      // For this demo, let's export what's on screen.
      const citationIds = citations.map(c => c._id);
      
      const res = await axiosInstance.post("/bibliography/export", {
        citationIds,
        format: formatType,
        sort: "alpha"
      }, { responseType: 'blob' }); // Expecting a file blob
      
      // Browser download trick
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bibliography.${formatType}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="text-muted-foreground mt-1">Manage, copy, and export your saved citations.</p>
        </div>
        
        <div className="flex gap-2 items-center">
          <Select onValueChange={(val: string) => handleExport(val)}>
            <SelectTrigger className="w-[140px]">
              <Download className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Export as..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="txt">Plain Text (.txt)</SelectItem>
              <SelectItem value="docx">Word (.docx)</SelectItem>
              <SelectItem value="pdf">PDF (.pdf)</SelectItem>
              <SelectItem value="bib">BibTeX (.bib)</SelectItem>
              <SelectItem value="ris">RIS (.ris)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search authors, titles..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            <div className="flex w-full md:w-auto items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:inline-block">Filter by style:</span>
              <Select value={style} onValueChange={(val: string) => { setStyle(val); setPage(1); }}>
                <SelectTrigger className="w-full md:w-[120px]">
                  <SelectValue placeholder="All Styles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  <SelectItem value="apa">APA</SelectItem>
                  <SelectItem value="mla">MLA</SelectItem>
                  <SelectItem value="chicago">Chicago</SelectItem>
                  <SelectItem value="harvard">Harvard</SelectItem>
                  <SelectItem value="ieee">IEEE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : citations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <p className="text-lg font-medium mb-1">No citations found</p>
              <p className="text-sm">Generate some citations and save them to see them here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[500px]">Citation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Style</TableHead>
                    <TableHead>Saved On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {citations.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-serif">
                        <p className="line-clamp-2">{c.citation}</p>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">{c.sourceType}</TableCell>
                      <TableCell className="uppercase text-muted-foreground font-medium">{c.style}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(c.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => copyText(c.citation)} title="Copy full citation">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(c._id)} title="Delete citation">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, totalItems)} of {totalItems} entries
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

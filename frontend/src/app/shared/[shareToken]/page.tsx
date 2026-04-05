"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { FileText, Copy, Download } from "lucide-react";
import axiosInstance from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function SharedProjectPage() {
  const params = useParams();
  const token = params.shareToken as string;
  const { toast } = useToast();

  const [project, setProject] = useState<any>(null);
  const [citations, setCitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchSharedData = async () => {
      try {
        setIsLoading(true);
        const { data } = await axiosInstance.get(`/projects/shared/${token}`);
        if (data.success) {
          setProject(data.data.project);
          setCitations(data.data.citations);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "This shared link is invalid or has expired.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedData();
  }, [token]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const handleExport = async (formatType: string) => {
    if (citations.length === 0) return toast({ title: "Nothing to export" });
    try {
      // For shared links, we'll export via the project citations endpoint, but since the
      // original export requires auth, we actually didn't build a public export route in backend.
      // So as a fallback frontend implementation for TXT:
      if (formatType === 'txt') {
         const text = citations.map(c => c.citation).sort().join('\n\n');
         const blob = new Blob([text], { type: 'text/plain' });
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `${project.name.replace(/\s+/g, '_')}_Bibliography.txt`;
         a.click();
         return;
      }
      
      toast({ title: "Other formats require login for public links.", variant: "destructive" });
    } catch (err) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-muted/20">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Project Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-muted/20 pb-20">
        <div className="bg-background border-b pt-12 pb-8">
          <div className="container px-4 md:px-8 mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground mb-4">
                  Public Project Viewer
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{project.name}</h1>
                <p className="text-muted-foreground mt-3 max-w-3xl text-lg">
                  {project.description || "A collection of citations"}
                </p>
                <div className="text-sm text-muted-foreground mt-4 flex items-center gap-4">
                  <span>Created by <strong>{project.userId.name}</strong></span>
                  <span>•</span>
                  <span>Last updated {format(new Date(project.updatedAt), "MMMM d, yyyy")}</span>
                  <span>•</span>
                  <span>{citations.length} sources</span>
                </div>
              </div>

              <div>
                <Select onValueChange={(val: string) => handleExport(val)}>
                  <SelectTrigger className="w-[160px] h-10">
                    <Download className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Export Text..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="txt">Plain Text (.txt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="container px-4 md:px-8 mx-auto max-w-5xl mt-8">
          {citations.length === 0 ? (
            <Card className="border-dashed shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground">This project has no citations yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Bibliography</h2>
              {citations.sort((a,b) => a.citation.localeCompare(b.citation)).map((cite, index) => (
                <Card key={cite._id} className="group transition-all hover:shadow-md">
                  <CardHeader className="py-4 flex flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-serif leading-relaxed text-lg">{cite.citation}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-3 font-medium opacity-70">
                        <span className="uppercase">{cite.style}</span>
                        <span className="capitalize">{cite.sourceType}</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => copyText(cite.citation)}
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

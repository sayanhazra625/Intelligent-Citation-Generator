"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sparkles,
  Loader2,
  Link as LinkIcon,
  Save,
  Copy,
  CheckCircle2,
  FileText,
  BookOpen,
  GraduationCap,
  Globe,
  Search,
  AlertTriangle,
} from "lucide-react";
import axiosInstance from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/useAuthStore";

const STYLES = ["apa", "mla", "chicago", "harvard", "vancouver", "ieee"];
const SOURCE_TYPES = ["journal", "book", "book-chapter", "website", "thesis", "conference"];

const generateSchema = z.object({
  rawInput: z.string().min(5, "Input must carry some reference details."),
  style: z.string(),
  sourceType: z.string(),
});

export default function DashboardPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Lookup inputs for each tab
  const [doiInput, setDoiInput] = useState("");
  const [pubmedInput, setPubmedInput] = useState("");
  const [bookInput, setBookInput] = useState("");
  const [scholarInput, setScholarInput] = useState("");
  const [urlInput, setUrlInput] = useState("");

  const form = useForm<z.infer<typeof generateSchema>>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      rawInput: "",
      style: user?.preferences?.defaultStyle || "apa",
      sourceType: user?.preferences?.defaultSourceType || "journal",
    },
  });

  async function handleGenerate(values: z.infer<typeof generateSchema>) {
    try {
      setIsGenerating(true);
      setResult(null);
      const { data } = await axiosInstance.post("/citations/generate", values);
      if (data.success) {
        setResult(data.data);
      }
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.response?.data?.message || "Ensure you have the Gemini API key set.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  /**
   * Unified lookup handler for all metadata sources.
   */
  async function handleLookup(
    source: "doi" | "pmid" | "pubmed-search" | "isbn" | "book-search" | "scholar" | "url",
    inputValue: string
  ) {
    if (!inputValue.trim()) return;

    const endpointMap: Record<string, { endpoint: string; body: Record<string, string> }> = {
      doi: { endpoint: "/citations/lookup-doi", body: { doi: inputValue } },
      pmid: { endpoint: "/citations/lookup-pmid", body: { pmid: inputValue } },
      "pubmed-search": { endpoint: "/citations/search-pubmed", body: { query: inputValue } },
      isbn: { endpoint: "/citations/lookup-isbn", body: { isbn: inputValue } },
      "book-search": { endpoint: "/citations/search-books", body: { query: inputValue } },
      scholar: { endpoint: "/citations/search-scholar", body: { query: inputValue } },
      url: { endpoint: "/citations/lookup-url", body: { url: inputValue } },
    };

    const { endpoint, body } = endpointMap[source];

    try {
      setIsLookingUp(true);
      const { data } = await axiosInstance.post(endpoint, body);
      if (data.success) {
        form.setValue("rawInput", data.data.formatted);
        // Auto-set source type based on lookup source
        if (source === "isbn" || source === "book-search") {
          form.setValue("sourceType", "book");
        } else if (source === "url") {
          form.setValue("sourceType", "website");
        } else {
          form.setValue("sourceType", "journal");
        }
        toast({
          title: "Metadata found!",
          description: "Populated the input box. Click Generate to format it.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lookup failed",
        description: error.response?.data?.message || "Could not fetch metadata.",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  }

  /**
   * Smart detect for DOI tab — if it starts with "10.", treat as DOI, 
   * otherwise if starts with http, treat as URL from DOI field.
   */
  function handleDoiFetch() {
    const val = doiInput.trim();
    if (!val) return;
    handleLookup("doi", val);
  }

  /**
   * Smart detect for PubMed tab — if purely numeric, treat as PMID, else search.
   */
  function handlePubmedFetch() {
    const val = pubmedInput.trim();
    if (!val) return;
    const cleanVal = val.replace(/^PMID:\s*/i, "");
    if (/^\d+$/.test(cleanVal)) {
      handleLookup("pmid", val);
    } else {
      handleLookup("pubmed-search", val);
    }
  }

  /**
   * Smart detect for Book tab — if looks like ISBN (digits/dashes), lookup ISBN, else search.
   */
  function handleBookFetch() {
    const val = bookInput.trim();
    if (!val) return;
    const cleaned = val.replace(/^ISBN[:\s]*/i, "").replace(/[-\s]/g, "");
    if (/^(\d{10}|\d{13}|\d{9}X)$/i.test(cleaned)) {
      handleLookup("isbn", val);
    } else {
      handleLookup("book-search", val);
    }
  }

  async function handleSave() {
    if (!result) return;
    try {
      const payload = { ...result };
      const { data } = await axiosInstance.post("/citations", payload);
      if (data.success) {
        toast({ title: "Saved to Library!" });
      }
    } catch (error) {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Citation</h1>
        <p className="text-muted-foreground mt-2">Paste raw details or use an auto-fetcher to pull metadata automatically.</p>
      </div>

      <div className="grid gap-6">
        {/* Auto Fetcher Card with Tabs */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
              <LinkIcon className="w-5 h-5 mr-2 text-primary" />
              Auto-Fetch Metadata
            </CardTitle>
            <CardDescription>Search across multiple academic databases to instantly grab publication details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="doi" className="w-full">
              <TabsList className="grid w-full grid-cols-5 h-auto">
                <TabsTrigger value="doi" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">DOI</span>
                  <span className="sm:hidden">DOI</span>
                </TabsTrigger>
                <TabsTrigger value="pubmed" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
                  <Search className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">PubMed</span>
                  <span className="sm:hidden">PM</span>
                </TabsTrigger>
                <TabsTrigger value="book" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">ISBN / Book</span>
                  <span className="sm:hidden">Book</span>
                </TabsTrigger>
                <TabsTrigger value="scholar" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Scholar</span>
                  <span className="sm:hidden">GS</span>
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">URL</span>
                  <span className="sm:hidden">URL</span>
                </TabsTrigger>
              </TabsList>

              {/* DOI Tab */}
              <TabsContent value="doi" className="mt-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Enter a DOI to fetch metadata from <strong>CrossRef</strong>.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="doi-input"
                      placeholder="e.g. 10.1038/s41586-020-2649-2"
                      value={doiInput}
                      onChange={(e) => setDoiInput(e.target.value)}
                      disabled={isLookingUp}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleDoiFetch())}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleDoiFetch}
                      disabled={isLookingUp || !doiInput.trim()}
                    >
                      {isLookingUp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Fetch
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* PubMed Tab */}
              <TabsContent value="pubmed" className="mt-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Enter a <strong>PMID</strong> (e.g. 33073741) or search by keywords. Powered by <strong>NCBI PubMed</strong>.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="pubmed-input"
                      placeholder="e.g. 33073741 or CRISPR gene editing"
                      value={pubmedInput}
                      onChange={(e) => setPubmedInput(e.target.value)}
                      disabled={isLookingUp}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handlePubmedFetch())}
                    />
                    <Button
                      variant="secondary"
                      onClick={handlePubmedFetch}
                      disabled={isLookingUp || !pubmedInput.trim()}
                    >
                      {isLookingUp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {/^\d+$/.test(pubmedInput.trim().replace(/^PMID:\s*/i, "")) ? "Lookup" : "Search"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ISBN / Book Tab */}
              <TabsContent value="book" className="mt-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Enter an <strong>ISBN</strong> or search by book title/author. Powered by <strong>Open Library</strong>.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="book-input"
                      placeholder="e.g. 978-0-13-468599-1 or Design Patterns"
                      value={bookInput}
                      onChange={(e) => setBookInput(e.target.value)}
                      disabled={isLookingUp}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleBookFetch())}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleBookFetch}
                      disabled={isLookingUp || !bookInput.trim()}
                    >
                      {isLookingUp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {/^(\d{10}|\d{13}|\d{9}X|[\d-]{10,})$/i.test(bookInput.trim().replace(/^ISBN[:\s]*/i, "").replace(/[-\s]/g, "")) ? "Lookup" : "Search"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Google Scholar Tab */}
              <TabsContent value="scholar" className="mt-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-muted-foreground flex-1">
                      Search <strong>Google Scholar</strong> by keywords. Returns the top result.
                    </p>
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600 border border-amber-500/20">
                      <AlertTriangle className="w-3 h-3" />
                      Best-effort
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="scholar-input"
                      placeholder='e.g. "attention is all you need" transformer'
                      value={scholarInput}
                      onChange={(e) => setScholarInput(e.target.value)}
                      disabled={isLookingUp}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleLookup("scholar", scholarInput))}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => handleLookup("scholar", scholarInput)}
                      disabled={isLookingUp || !scholarInput.trim()}
                    >
                      {isLookingUp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Search
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    ⚠️ Google Scholar may rate-limit requests. If this fails, use DOI or PubMed instead.
                  </p>
                </div>
              </TabsContent>

              {/* URL Tab */}
              <TabsContent value="url" className="mt-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Enter a <strong>URL</strong> to scrape metadata from Open Graph tags.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="url-input"
                      placeholder="e.g. https://www.nature.com/articles/..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={isLookingUp}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleLookup("url", urlInput))}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => handleLookup("url", urlInput)}
                      disabled={isLookingUp || !urlInput.trim()}
                    >
                      {isLookingUp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Fetch
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Main Generator Form */}
        <Card className="border-primary/50 shadow-md">
          <CardHeader>
            <CardTitle>AI Formatting</CardTitle>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGenerate)}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="style"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Style</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STYLES.map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sourceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SOURCE_TYPES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="rawInput"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raw Reference Data</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Paste anything here... e.g. 'Smith J, 2023, Nature journal machine learning'" 
                          className="min-h-[120px] resize-y"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="bg-muted/30 pt-6">
                <Button type="submit" className="w-full h-12 text-lg font-medium" disabled={isGenerating}>
                  {isGenerating ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing with Gemini...</>
                  ) : (
                    <><Sparkles className="mr-2 h-5 w-5" /> Generate Citation</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        {/* Results Card */}
        {result && (
          <Card className="border-green-500/50 shadow-lg animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
            <CardHeader className="bg-green-500/5 border-b pb-4">
              <CardTitle className="text-green-700 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Citation Generated
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="full" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="full">Bibliography Entry</TabsTrigger>
                  <TabsTrigger value="intext">In-Text Citation</TabsTrigger>
                </TabsList>
                <TabsContent value="full" className="p-4 bg-muted rounded-md text-foreground shadow-inner min-h-[80px] flex items-center">
                  <p className="font-serif text-lg leading-relaxed">{result.citation}</p>
                </TabsContent>
                <TabsContent value="intext" className="p-4 bg-muted rounded-md text-foreground shadow-inner min-h-[80px] flex items-center">
                  <p className="font-serif text-lg leading-relaxed">{result.inTextCitation}</p>
                </TabsContent>
              </Tabs>
              
              {result.notes && (
                <div className="mt-4 p-3 bg-blue-500/10 text-blue-800 rounded text-sm border border-blue-200">
                  <strong className="font-semibold">AI Note: </strong>{result.notes}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => {
                  navigator.clipboard.writeText(result.citation);
                  toast({ title: "Copied to clipboard!" });
                }}
              >
                <Copy className="w-4 h-4 mr-2" /> Copy Full
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> Save to Library
              </Button>
            </CardFooter>
          </Card>
        )}

      </div>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, FileText, Globe, Sparkles, BookOpen, Quote, GraduationCap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">


      {/* Hero Section */}
      <section className="w-full py-20 md:py-28 lg:py-40 bg-gradient-to-b from-background via-background to-muted/50 overflow-hidden relative">
        
        {/* Floating Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          
          {/* Left side - Floating APA citation card */}
          <div className="hidden lg:block absolute left-[5%] top-[15%] float-slow slide-left">
            <div className="bg-background/90 backdrop-blur border rounded-xl p-4 shadow-lg max-w-[260px] pulse-glow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">APA Style</span>
              </div>
              <p className="text-xs text-muted-foreground font-serif leading-relaxed">
                Smith, J. A., & Johnson, B. (2024). <em>Machine learning in academic research</em>. Nature, 612, 34–41.
              </p>
            </div>
          </div>

          {/* Right side - Floating MLA citation */}
          <div className="hidden lg:block absolute right-[5%] top-[20%] float-medium slide-right">
            <div className="bg-background/90 backdrop-blur border rounded-xl p-4 shadow-lg max-w-[250px] pulse-glow" style={{animationDelay: '1s'}}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center">
                  <Quote className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">MLA Style</span>
              </div>
              <p className="text-xs text-muted-foreground font-serif leading-relaxed">
                Davis, Emily. "The Future of AI." <em>Scientific American</em>, vol. 45, no. 3, 2024, pp. 12–18.
              </p>
            </div>
          </div>

          {/* Left bottom - Floating document icon */}
          <div className="hidden lg:block absolute left-[8%] bottom-[20%] float-fast">
            <div className="bg-background/80 backdrop-blur border rounded-lg p-3 shadow-md">
              <FileText className="w-8 h-8 text-primary/60" />
            </div>
          </div>

          {/* Right bottom - Floating graduation cap */}
          <div className="hidden lg:block absolute right-[10%] bottom-[25%] float-slow" style={{animationDelay: '2s'}}>
            <div className="bg-background/80 backdrop-blur border rounded-lg p-3 shadow-md">
              <GraduationCap className="w-8 h-8 text-primary/60" />
            </div>
          </div>

          {/* Small floating dots */}
          <div className="hidden md:block absolute left-[20%] top-[40%] w-3 h-3 rounded-full bg-primary/20 float-fast" style={{animationDelay: '0.5s'}} />
          <div className="hidden md:block absolute right-[25%] top-[35%] w-2 h-2 rounded-full bg-blue-400/30 float-medium" style={{animationDelay: '1.5s'}} />
          <div className="hidden md:block absolute left-[15%] bottom-[35%] w-2.5 h-2.5 rounded-full bg-primary/15 float-slow" style={{animationDelay: '3s'}} />
          <div className="hidden md:block absolute right-[15%] bottom-[40%] w-2 h-2 rounded-full bg-blue-300/20 float-fast" style={{animationDelay: '2s'}} />
        </div>

        {/* Hero Content */}
        <div className="container px-4 md:px-6 mx-auto text-center flex flex-col items-center max-w-4xl space-y-8 relative z-10">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
            Powered by Google Gemini AI
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
            Generate Perfect Citations <br className="hidden md:block" />
            in <span className="text-primary">Seconds</span>
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Paste a messy URL, a DOI, or scattered text. Our AI instantly formats it into perfect APA, MLA, Chicago, Harvard, and more. 
          </p>
          <div className="flex gap-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 font-medium">
                Start Generating for Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-12 px-8 font-medium">
                See Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-20 bg-background">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Stop wrestling with formatting rules</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              The Intelligent Citation Generator handles all the tedious punctuation, ordering, and italics for you.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            
            <div className="flex flex-col justify-center space-y-4 border p-8 rounded-xl bg-card shadow-sm h-full">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">AI Data Extraction</h3>
              <p className="text-muted-foreground leading-relaxed">
                Paste any messy text snippet. Our Gemini AI engine intelligently extracts the authors, titles, dates, and publishers automatically.
              </p>
            </div>

            <div className="flex flex-col justify-center space-y-4 border p-8 rounded-xl bg-card shadow-sm h-full">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Auto-Fetch Metadata</h3>
              <p className="text-muted-foreground leading-relaxed">
                Just drop a DOI or a website URL. We instantly scrape the web and CrossRef databases to pull the exact publication details.
              </p>
            </div>

            <div className="flex flex-col justify-center space-y-4 border p-8 rounded-xl bg-card shadow-sm h-full">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">1-Click Export</h3>
              <p className="text-muted-foreground leading-relaxed">
                Organize citations into projects and export your entire bibliography directly to Word (.docx), PDF, plain text, BibTeX, or RIS.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Free For All Section */}
      <section id="pricing" className="w-full py-20 bg-muted/50 border-t">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl text-center">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">100% Free. No catch.</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
              All features are completely free — unlimited AI generations, all citation styles, DOI & URL auto-fetch, projects, and exports. No credit card required, ever.
            </p>
            <ul className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mt-4">
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-primary mr-3 shrink-0" /> Unlimited AI generations</li>
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-primary mr-3 shrink-0" /> All major citation styles</li>
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-primary mr-3 shrink-0" /> Auto-fetch from DOI & URL</li>
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-primary mr-3 shrink-0" /> Unlimited saved projects</li>
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-primary mr-3 shrink-0" /> Export to all formats</li>
              <li className="flex items-center"><CheckCircle2 className="h-5 w-5 text-primary mr-3 shrink-0" /> Shareable bibliography links</li>
            </ul>
            <Link href="/register" className="mt-4">
              <Button size="lg" className="h-12 px-8 font-medium">
                Start Generating for Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

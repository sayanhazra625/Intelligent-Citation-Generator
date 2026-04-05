"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { FolderKanban, Plus, Link as LinkIcon, ExternalLink, Trash2, MoreVertical } from "lucide-react";
import axiosInstance from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProjectsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const { data } = await axiosInstance.get("/projects");
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      toast({ title: "Failed to load projects", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!newProjectName) return;
    try {
      const { data } = await axiosInstance.post("/projects", {
        name: newProjectName,
        description: newProjectDesc,
      });
      if (data.success) {
        setProjects([data.data, ...projects]);
        setIsCreateOpen(false);
        setNewProjectName("");
        setNewProjectDesc("");
        toast({ title: "Project created" });
      }
    } catch (error) {
      toast({ title: "Creation failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project? Your citations will remain in the library.")) return;
    try {
      await axiosInstance.delete(`/projects/${id}`);
      setProjects(projects.filter((p) => p._id !== id));
      toast({ title: "Project deleted" });
    } catch (error) {
      toast({ title: "Deletion failed", variant: "destructive" });
    }
  };

  const handleShare = async (id: string) => {
    try {
      const { data } = await axiosInstance.post(`/projects/${id}/share`);
      if (data.success) {
        setProjects(projects.map(p => p._id === id ? { ...p, shareToken: data.data.shareToken, isPublic: true } : p));
        toast({ title: "Share link generated!" });
      }
    } catch (error) {
      toast({ title: "Failed to generate link", variant: "destructive" });
    }
  };

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Organize your bibliographies by essay, thesis, or module.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>Group related citations together.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input 
                  placeholder="Project Name (e.g. Chapter 2 Literature Review)" 
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Textarea 
                  placeholder="Description (optional)" 
                  value={newProjectDesc} 
                  onChange={(e: any) => setNewProjectDesc(e.target.value)} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newProjectName}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <FolderKanban className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Create a project to group your citations together and generate shareable bibliography pages.
            </p>
            <Button className="mt-6" onClick={() => setIsCreateOpen(true)}>Create your first project</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project._id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-xl line-clamp-1">{project.name}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2 min-h-[40px]">
                    {project.description || "No description"}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(project._id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                <div className="text-sm text-muted-foreground flex items-center mt-2">
                  <span className="font-medium text-foreground mr-1">{project.citationCount}</span> citations
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Updated {format(new Date(project.updatedAt), "MMM d, yyyy")}
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t bg-muted/10 gap-2">
                {project.isPublic && project.shareToken ? (
                  <Button variant="secondary" className="w-full text-xs" onClick={() => copyShareLink(project.shareToken)}>
                    <LinkIcon className="w-4 h-4 mr-2" /> Shared Link
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full text-xs" onClick={() => handleShare(project._id)}>
                    <ExternalLink className="w-4 h-4 mr-2" /> Publish Link
                  </Button>
                )}
                {/* Note: Clicking through to view individual project citations could be a future feature */}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

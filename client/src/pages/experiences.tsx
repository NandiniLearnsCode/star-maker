import { useState, useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Plus, Upload, Briefcase, Calendar, ChevronRight, FileText, Sparkles, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { useExperiences, useCreateExperience, useParseResume, useUploadResume } from "@/hooks/use-experiences";
import { useWorkspaceId } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Experiences() {
  const { data: experiences, isLoading } = useExperiences();
  const createMutation = useCreateExperience();
  const parseMutation = useParseResume();
  const uploadMutation = useUploadResume();
  const wsId = useWorkspaceId();

  const [isOpen, setIsOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    title: "",
    organization: "",
    dateRange: "",
    type: "work",
    description: "",
    source: "user_added"
  });
  const [resumeText, setResumeText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(manualForm, {
      onSuccess: () => {
        setIsOpen(false);
        setManualForm({ title: "", organization: "", dateRange: "", type: "work", description: "", source: "user_added" });
      }
    });
  };

  const handleParseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    parseMutation.mutate(resumeText, {
      onSuccess: () => {
        setIsOpen(false);
        setResumeText("");
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Experiences</h1>
            <p className="text-muted-foreground mt-2">Manage your work history to generate powerful STAR stories.</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="hover-elevate font-medium shadow-md shadow-primary/20">
                <Plus className="w-5 h-5 mr-2" /> Add Experience
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden">
              <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30">
                <DialogTitle className="text-xl font-display">Add Experience</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-background p-0 px-6 h-12">
                  <TabsTrigger value="upload" data-testid="tab-upload" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                    <Upload className="w-4 h-4 mr-2" /> Upload Resume
                  </TabsTrigger>
                  <TabsTrigger value="parse" data-testid="tab-paste" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                    <Sparkles className="w-4 h-4 mr-2" /> Paste Text
                  </TabsTrigger>
                  <TabsTrigger value="manual" data-testid="tab-manual" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                    <Briefcase className="w-4 h-4 mr-2" /> Manual Entry
                  </TabsTrigger>
                </TabsList>
                
                <div className="p-6">
                  <TabsContent value="upload" className="mt-0 outline-none">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Upload your resume (PDF or DOCX)</Label>
                        <div 
                          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files[0];
                            if (file) setSelectedFile(file);
                          }}
                          data-testid="dropzone-upload"
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setSelectedFile(file);
                            }}
                            data-testid="input-file-resume"
                          />
                          {selectedFile ? (
                            <div className="flex flex-col items-center gap-2">
                              <FileText className="w-10 h-10 text-primary" />
                              <p className="text-sm font-medium" data-testid="text-selected-file">{selectedFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-10 h-10 text-muted-foreground" />
                              <p className="text-sm font-medium">Click to browse or drag & drop</p>
                              <p className="text-xs text-muted-foreground">Supports PDF and DOCX files up to 10MB</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        disabled={!selectedFile || uploadMutation.isPending}
                        onClick={() => {
                          if (selectedFile) {
                            uploadMutation.mutate(selectedFile, {
                              onSuccess: () => {
                                setIsOpen(false);
                                setSelectedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }
                            });
                          }
                        }}
                        data-testid="button-upload-resume"
                      >
                        {uploadMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Extracting experiences...
                          </>
                        ) : (
                          "Upload & Extract Experiences"
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="parse" className="mt-0 outline-none">
                    <form onSubmit={handleParseSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Paste your resume text</Label>
                        <Textarea 
                          placeholder="Paste your LinkedIn or resume text here. AI will extract your roles..." 
                          className="h-48 resize-none font-mono text-sm"
                          value={resumeText}
                          onChange={e => setResumeText(e.target.value)}
                          data-testid="textarea-paste-resume"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={!resumeText || parseMutation.isPending} data-testid="button-parse-resume">
                        {parseMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Extracting...
                          </>
                        ) : "Extract Experiences"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="manual" className="mt-0 outline-none">
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Job Title / Role</Label>
                          <Input required value={manualForm.title} onChange={e => setManualForm({...manualForm, title: e.target.value})} placeholder="e.g. Software Engineer" data-testid="input-title" />
                        </div>
                        <div className="space-y-2">
                          <Label>Organization</Label>
                          <Input required value={manualForm.organization} onChange={e => setManualForm({...manualForm, organization: e.target.value})} placeholder="e.g. Acme Corp" data-testid="input-organization" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Date Range</Label>
                        <Input required value={manualForm.dateRange} onChange={e => setManualForm({...manualForm, dateRange: e.target.value})} placeholder="e.g. Jan 2020 - Present" data-testid="input-date-range" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description / Responsibilities</Label>
                        <Textarea 
                          required 
                          className="h-32 resize-none" 
                          value={manualForm.description} 
                          onChange={e => setManualForm({...manualForm, description: e.target.value})}
                          placeholder="Describe what you did..."
                          data-testid="textarea-description"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-save-experience">
                        Save Experience
                      </Button>
                    </form>
                  </TabsContent>
                </div>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-xl bg-muted/50 animate-pulse border border-border" />
            ))}
          </div>
        ) : experiences?.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-card rounded-2xl border border-border border-dashed shadow-sm"
          >
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">No experiences yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Add your work history to start generating AI-powered STAR answers for your upcoming interviews.
            </p>
            <Button onClick={() => setIsOpen(true)} className="hover-elevate shadow-md shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Add Your First Experience
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {experiences?.map((exp, idx) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link href={`/w/${wsId}/experiences/${exp.id}`}>
                  <Card className="h-full cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-300 group flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                        {exp.type}
                      </div>
                      <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                        {exp.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1 text-sm">
                        <Briefcase className="w-3.5 h-3.5" /> {exp.organization}
                      </CardDescription>
                      <CardDescription className="flex items-center gap-2 mt-1 text-sm">
                        <Calendar className="w-3.5 h-3.5" /> {exp.dateRange}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-4">
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {exp.description}
                      </p>
                    </CardContent>
                    <div className="px-6 py-4 border-t border-border/50 bg-muted/20 flex items-center justify-between text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors">
                      <span>View & Generate</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

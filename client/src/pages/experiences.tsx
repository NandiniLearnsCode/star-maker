import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Plus, Upload, Briefcase, Calendar, ChevronRight, FileText, Sparkles, Loader2, Target, Building2, Mic } from "lucide-react";
import { Layout } from "@/components/layout";
import { useExperiences, useCreateExperience, useParseResume, useUploadResume } from "@/hooks/use-experiences";
import { useUpdateWorkspacePreferences, useWorkspacePreferences } from "@/hooks/use-workspace-preferences";
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
  const { data: workspacePreferences } = useWorkspacePreferences();
  const updateWorkspacePreferences = useUpdateWorkspacePreferences();
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
  const [interviewTarget, setInterviewTarget] = useState({
    targetCompanyName: "",
    targetRole: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workspacePreferences) {
      setInterviewTarget({
        targetCompanyName: workspacePreferences.targetCompanyName || "",
        targetRole: workspacePreferences.targetRole || "",
      });
    }
  }, [workspacePreferences]);

  const saveInterviewTarget = () => {
    return updateWorkspacePreferences.mutateAsync({
      targetCompanyName: interviewTarget.targetCompanyName,
      targetRole: interviewTarget.targetRole,
    });
  };

  const handleSaveInterviewTarget = async () => {
    try {
      await saveInterviewTarget();
    } catch {
      return;
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveInterviewTarget();
    } catch {
      return;
    }
    createMutation.mutate(manualForm, {
      onSuccess: () => {
        setIsOpen(false);
        setManualForm({ title: "", organization: "", dateRange: "", type: "work", description: "", source: "user_added" });
      }
    });
  };

  const handleParseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveInterviewTarget();
    } catch {
      return;
    }
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
                  <div className="mb-6 rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                    <div>
                      <h3 className="font-display font-semibold text-sm">Optional interview target</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add this now if you already know where you are interviewing. You can change it later in Voice Practice.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Target company</Label>
                        <Input
                          placeholder="e.g. Amazon"
                          value={interviewTarget.targetCompanyName}
                          onChange={e => setInterviewTarget(prev => ({ ...prev, targetCompanyName: e.target.value }))}
                          data-testid="input-target-company"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Target role</Label>
                        <Input
                          placeholder="e.g. Product Manager"
                          value={interviewTarget.targetRole}
                          onChange={e => setInterviewTarget(prev => ({ ...prev, targetRole: e.target.value }))}
                          data-testid="input-target-role"
                        />
                      </div>
                    </div>
                  </div>

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
                        disabled={!selectedFile || uploadMutation.isPending || updateWorkspacePreferences.isPending}
                        onClick={async () => {
                          if (selectedFile) {
                            try {
                              await saveInterviewTarget();
                            } catch {
                              return;
                            }
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
                        {(uploadMutation.isPending || updateWorkspacePreferences.isPending) ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving and extracting...
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
                      <Button type="submit" className="w-full" disabled={!resumeText || parseMutation.isPending || updateWorkspacePreferences.isPending} data-testid="button-parse-resume">
                        {(parseMutation.isPending || updateWorkspacePreferences.isPending) ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving and extracting...
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
                      <Button type="submit" className="w-full" disabled={createMutation.isPending || updateWorkspacePreferences.isPending} data-testid="button-save-experience">
                        {(createMutation.isPending || updateWorkspacePreferences.isPending) ? "Saving..." : "Save Experience"}
                      </Button>
                    </form>
                  </TabsContent>
                </div>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 text-primary p-2 rounded-xl">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Set your interview target</CardTitle>
                <CardDescription>
                  Start with the company and role if you know them. StarMaker uses this to tailor voice-coach questions.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Company you are interviewing with
                </Label>
                <Input
                  placeholder="e.g. Amazon"
                  value={interviewTarget.targetCompanyName}
                  onChange={e => setInterviewTarget(prev => ({ ...prev, targetCompanyName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Role you are interviewing for
                </Label>
                <Input
                  placeholder="e.g. Product Manager"
                  value={interviewTarget.targetRole}
                  onChange={e => setInterviewTarget(prev => ({ ...prev, targetRole: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <div className="font-semibold mb-1">1. Set target</div>
                <p className="text-muted-foreground">Tell StarMaker the company and role, or leave it blank for general practice.</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <div className="font-semibold mb-1">2. Upload resume</div>
                <p className="text-muted-foreground">Extract experiences and generate STAR examples from your background.</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <div className="font-semibold mb-1">3. Practice aloud</div>
                <p className="text-muted-foreground">The voice coach asks competency questions; you choose which example to answer with.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleSaveInterviewTarget} disabled={updateWorkspacePreferences.isPending}>
                {updateWorkspacePreferences.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving target...</>
                ) : (
                  "Save interview target"
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(true)}>
                <Upload className="w-4 h-4 mr-2" /> Upload resume or add experience
              </Button>
              {experiences && experiences.length > 0 && (
                <Link href={`/w/${wsId}/practice`}>
                  <Button variant="outline">
                    <Mic className="w-4 h-4 mr-2" /> Go to Voice Practice
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

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

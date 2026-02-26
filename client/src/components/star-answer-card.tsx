import { useState } from "react";
import { type StarAnswer, type Company } from "@shared/schema";
import { useUpdateStarAnswer, useDeleteStarAnswer, useCustomizeStarAnswer } from "@/hooks/use-star-answers";
import { useScrapeCompany, useCompanies } from "@/hooks/use-companies";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Trash2, Building, Sparkles, Target, Activity, CheckCircle, ArrowRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";

export function StarAnswerCard({ answer }: { answer: StarAnswer }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    situation: answer.situation,
    task: answer.task,
    action: answer.action,
    result: answer.result,
  });

  const [companyUrl, setCompanyUrl] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const updateMutation = useUpdateStarAnswer();
  const deleteMutation = useDeleteStarAnswer();
  const scrapeMutation = useScrapeCompany();
  const customizeMutation = useCustomizeStarAnswer();
  const { data: companies } = useCompanies();

  const handleSave = () => {
    updateMutation.mutate({ id: answer.id, ...editForm }, {
      onSuccess: () => setIsEditing(false)
    });
  };

  const handleCustomize = async () => {
    if (!companyUrl) return;
    
    // First scrape the company
    scrapeMutation.mutate({ url: companyUrl }, {
      onSuccess: (company) => {
        // Then customize the answer
        customizeMutation.mutate({ starAnswerId: answer.id, companyId: company.id }, {
          onSuccess: () => {
            setIsPopoverOpen(false);
            setCompanyUrl("");
          }
        });
      }
    });
  };

  const sections = [
    { key: "situation" as const, label: "Situation", icon: Target, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
    { key: "task" as const, label: "Task", icon: Activity, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
    { key: "action" as const, label: "Action", icon: Sparkles, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" },
    { key: "result" as const, label: "Result", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
  ];

  const customizations = answer.companyCustomizations as Array<{ companyId: number; companyName: string; date: string; customizedData: Record<string, string> }> | null;
  const hasCustomizations = Array.isArray(customizations) && customizations.length > 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card overflow-hidden group">
      <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
        <div className="flex justify-between items-start">
          <div>
            <Badge variant="outline" className="mb-2 bg-background font-medium">
              {answer.competency}
            </Badge>
            <CardTitle className="text-xl font-display">STAR Answer</CardTitle>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="hover-elevate" data-testid={`button-tailor-${answer.id}`}>
                      <Building className="w-4 h-4 mr-2" />
                      Tailor
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Tailor to a Company</h4>
                        <p className="text-xs text-muted-foreground">Enter a company URL. AI will analyze their culture and tweak this answer.</p>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="e.g. https://stripe.com" 
                          value={companyUrl}
                          onChange={e => setCompanyUrl(e.target.value)}
                          className="flex-1"
                          data-testid={`input-company-url-${answer.id}`}
                        />
                      </div>
                      <Button 
                        onClick={handleCustomize} 
                        disabled={!companyUrl || scrapeMutation.isPending || customizeMutation.isPending}
                        className="w-full"
                        data-testid={`button-customize-submit-${answer.id}`}
                      >
                        {(scrapeMutation.isPending || customizeMutation.isPending) ? "Analyzing..." : "Tailor Answer"}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMutation.mutate(answer.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider">{label}</h3>
              </div>
              
              {isEditing ? (
                <Textarea
                  value={editForm[key]}
                  onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
                  className="min-h-[120px] resize-none focus-visible:ring-primary/50"
                />
              ) : (
                <div className="text-sm text-muted-foreground leading-relaxed p-3 bg-muted/20 rounded-lg border border-border/30 h-[calc(100%-2rem)]">
                  {answer[key]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Company Customizations Section */}
        <AnimatePresence>
          {hasCustomizations && !isEditing && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-8 pt-6 border-t border-border"
            >
              <h4 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> 
                Company Customizations
              </h4>
              
              <div className="space-y-4">
                {customizations.map((cust, idx) => (
                  <div key={idx} className="bg-primary/5 border border-primary/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-primary text-primary-foreground">{cust.companyName || `Company #${cust.companyId}`}</Badge>
                      <span className="text-xs text-muted-foreground">Tailored version</span>
                    </div>
                    
                    {cust.customizedData?.rationale && (
                      <p className="text-xs italic text-muted-foreground mb-3 border-l-2 border-primary/30 pl-3">
                        {cust.customizedData.rationale}
                      </p>
                    )}

                    <div className="space-y-3">
                      {sections.map(({ key, label }) => (
                        cust.customizedData?.[key] && (
                          <div key={key}>
                            <span className="text-xs font-semibold uppercase text-primary/70 mr-2">{label}:</span>
                            <span className="text-sm text-foreground/80">{cust.customizedData[key]}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

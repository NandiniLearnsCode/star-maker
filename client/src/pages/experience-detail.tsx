import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout";
import { useExperience } from "@/hooks/use-experiences";
import { useStarAnswers, useGenerateStarAnswers } from "@/hooks/use-star-answers";
import { useWorkspaceId } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, AlertCircle, Building2, Calendar, FileText } from "lucide-react";
import { StarAnswerCard } from "@/components/star-answer-card";
import { motion } from "framer-motion";

export default function ExperienceDetail() {
  const [, params] = useRoute("/w/:workspaceId/experiences/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const wsId = useWorkspaceId();
  
  const { data: experience, isLoading: expLoading } = useExperience(id);
  const { data: starAnswers, isLoading: starsLoading } = useStarAnswers(id);
  const generateMutation = useGenerateStarAnswers();

  if (expLoading) {
    return (
      <Layout>
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-pulse">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!experience) {
    return (
      <Layout>
        <div className="p-8 text-center mt-20">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold">Experience Not Found</h2>
          <Link href={`/w/${wsId}/experiences`}>
            <Button variant="outline" className="mt-4">Return to Experiences</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        <Link href={`/w/${wsId}/experiences`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Experiences
        </Link>
        
        <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">{experience.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-muted-foreground text-sm font-medium">
                  <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {experience.organization}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-border" />
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {experience.dateRange}</span>
                </div>
              </div>
              <Button 
                size="lg" 
                onClick={() => generateMutation.mutate(experience.id)}
                disabled={generateMutation.isPending}
                className="hover-elevate shadow-md shadow-primary/20 shrink-0 bg-gradient-to-r from-primary to-primary/90"
                data-testid="button-generate-star"
              >
                <Sparkles className="w-5 h-5 mr-2" /> 
                {generateMutation.isPending ? "Generating Answers..." : "Generate STAR Answers"}
              </Button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-border/50">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Description
              </h4>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {experience.description}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">STAR Stories</h2>
            <span className="bg-muted px-3 py-1 rounded-full text-sm font-medium text-muted-foreground">
              {starAnswers?.length || 0} Answers
            </span>
          </div>

          {generateMutation.isPending ? (
            <div className="py-20 text-center border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5">
              <Sparkles className="w-10 h-10 text-primary animate-pulse mx-auto mb-4" />
              <h3 className="text-lg font-medium">AI is crafting your stories...</h3>
              <p className="text-muted-foreground text-sm mt-2">This usually takes 5-15 seconds.</p>
            </div>
          ) : starsLoading ? (
            <div className="space-y-6">
              {[1,2].map(i => <div key={i} className="h-64 bg-muted/50 rounded-2xl animate-pulse" />)}
            </div>
          ) : !starAnswers || starAnswers.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border border-dashed">
              <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground">No stories generated yet</h3>
              <p className="text-muted-foreground mt-1 mb-4">Click the button above to extract behavioral interview answers.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {starAnswers.map((answer: any, i: number) => (
                <motion.div
                  key={answer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <StarAnswerCard answer={answer} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

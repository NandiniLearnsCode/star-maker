import { Layout } from "@/components/layout";
import { useStarAnswers } from "@/hooks/use-star-answers";
import { useExperiences } from "@/hooks/use-experiences";
import { StarAnswerCard } from "@/components/star-answer-card";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function AnswerBank() {
  const { data: answers, isLoading } = useStarAnswers();
  const { data: experiences } = useExperiences();
  const [searchTerm, setSearchTerm] = useState("");

  const experienceMap = useMemo(() => {
    const map = new Map<number, { title: string; organization: string }>();
    experiences?.forEach(e => map.set(e.id, { title: e.title, organization: e.organization }));
    return map;
  }, [experiences]);

  const filteredAnswers = answers?.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const exp = experienceMap.get(a.experienceId);
    const customizations = a.companyCustomizations as Array<{ companyName?: string }> | null;
    const companyNames = customizations?.map(c => c.companyName || "").join(" ") || "";
    return (
      a.competency.toLowerCase().includes(term) ||
      a.situation.toLowerCase().includes(term) ||
      a.task.toLowerCase().includes(term) ||
      a.action.toLowerCase().includes(term) ||
      a.result.toLowerCase().includes(term) ||
      (exp?.title.toLowerCase().includes(term) ?? false) ||
      (exp?.organization.toLowerCase().includes(term) ?? false) ||
      companyNames.toLowerCase().includes(term)
    );
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 text-primary p-2 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Answer Bank</h1>
          </div>
          <p className="text-muted-foreground text-lg mb-6">
            Your personal library of behavioral interview stories.
          </p>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              className="pl-10 h-12 text-base bg-card border-border/60 shadow-sm"
              placeholder="Search by competency, company, role, or keyword..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-muted/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredAnswers?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed shadow-sm">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold mb-2">No answers found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchTerm ? "Try adjusting your search terms." : "Go to Experiences to generate your first STAR stories."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredAnswers?.map((answer, i) => (
              <motion.div
                key={answer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.1, 0.5) }}
              >
                <StarAnswerCard answer={answer} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

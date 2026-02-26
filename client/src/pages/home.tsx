import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, BookOpen, Building, ArrowRight, Star, Target, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getStoredWorkspaceId, setStoredWorkspaceId } from "@/lib/workspace";

export default function Home() {
  const [, navigate] = useLocation();
  const [isCreating, setIsCreating] = useState(false);

  const handleGetStarted = async () => {
    const existingId = getStoredWorkspaceId();
    if (existingId) {
      try {
        const res = await fetch(`/api/workspaces/${existingId}`);
        if (res.ok) {
          navigate(`/w/${existingId}/experiences`);
          return;
        }
      } catch {}
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/workspaces", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create workspace");
      const ws = await res.json();
      setStoredWorkspaceId(ws.id);
      navigate(`/w/${ws.id}/experiences`);
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
  };

  const features = [
    {
      icon: Upload,
      title: "Upload Your Resume",
      description: "Drop in a PDF or Word doc and let AI extract all your experiences automatically.",
    },
    {
      icon: Sparkles,
      title: "Generate STAR Stories",
      description: "AI crafts polished Situation-Task-Action-Result answers mapped to key competencies.",
    },
    {
      icon: Building,
      title: "Tailor to Any Company",
      description: "Enter a company URL and your stories adapt to match their values and culture.",
    },
    {
      icon: BookOpen,
      title: "Search Your Answer Bank",
      description: "Find the right story fast — search by company, competency, or keyword.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/15 text-foreground/80 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-primary/20">
            <Star className="w-4 h-4" />
            AI-Powered Interview Prep
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
            Turn Your Experiences Into
            <span className="block text-primary mt-1">Interview-Ready Stories</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Upload your resume, and STAR Maker uses AI to generate polished behavioral 
            interview answers you can customize for any company.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="hover-elevate shadow-lg shadow-primary/25 text-base px-8 py-6"
              data-testid="button-get-started"
              onClick={handleGetStarted}
              disabled={isCreating}
            >
              {isCreating ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating your workspace...</>
              ) : (
                <>Get Started <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            No sign-up required. Your private workspace link is all you need.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="bg-primary/10 text-primary p-3 rounded-xl w-fit mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-display font-bold">How It Works</h2>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mt-8">
              {[
                { step: "1", label: "Upload resume or add experiences" },
                { step: "2", label: "Generate STAR answers with AI" },
                { step: "3", label: "Tailor to your target company" },
              ].map((item, i) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mb-2">
                      {item.step}
                    </div>
                    <span className="text-sm font-medium text-foreground max-w-[160px]">{item.label}</span>
                  </div>
                  {i < 2 && (
                    <Zap className="w-5 h-5 text-muted-foreground hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

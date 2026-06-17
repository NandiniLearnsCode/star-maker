import { useEffect, useMemo, useRef, useState } from "react";
import { Conversation, type Conversation as ElevenLabsConversation, type Mode, type Status } from "@elevenlabs/client";
import { Layout } from "@/components/layout";
import { useStarAnswers } from "@/hooks/use-star-answers";
import { useExperiences } from "@/hooks/use-experiences";
import {
  useAddPracticeTurn,
  useCompletePracticeSession,
  useCreatePracticeSession,
  useGeneratePracticeFeedback,
  usePracticeConversationToken,
  usePracticeSessions,
} from "@/hooks/use-practice";
import { useWorkspaceId } from "@/lib/workspace";
import { useWorkspacePreferences } from "@/hooks/use-workspace-preferences";
import { useToast } from "@/hooks/use-toast";
import { type PracticeSession } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, CheckCircle2, Loader2, Mic, MicOff, PhoneOff, Play, Radio, Sparkles } from "lucide-react";

type TranscriptTurn = {
  speaker: "user" | "agent";
  text: string;
  sequence: number;
};

type PracticeFeedback = {
  summary?: string;
  scores?: Record<string, number>;
  strengths?: string[];
  improvements?: string[];
  nextQuestion?: string;
  recommendedRewrite?: string;
};

function asFeedback(value: unknown): PracticeFeedback | null {
  if (!value || typeof value !== "object") return null;
  return value as PracticeFeedback;
}

function selectedAnswerIds(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((id): id is number => typeof id === "number") : [];
}

function compactText(value: string, maxWords = 22) {
  const words = value
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function inferAmazonLeadershipPrinciple(competency: string, targetRole: string) {
  const text = `${competency} ${targetRole}`.toLowerCase();
  if (text.includes("product") || text.includes("customer") || text.includes("user")) return "Customer Obsession";
  if (text.includes("lead")) return "Ownership";
  if (text.includes("problem") || text.includes("analysis") || text.includes("data")) return "Dive Deep";
  if (text.includes("invent") || text.includes("innovation") || text.includes("build")) return "Invent and Simplify";
  if (text.includes("conflict") || text.includes("stakeholder") || text.includes("communication")) return "Earn Trust";
  return "Ownership";
}

export default function Practice() {
  const wsId = useWorkspaceId();
  const { toast } = useToast();
  const { data: answers, isLoading: answersLoading } = useStarAnswers();
  const { data: experiences } = useExperiences();
  const { data: workspacePreferences } = useWorkspacePreferences();
  const { data: sessions } = usePracticeSessions();
  const createSession = useCreatePracticeSession();
  const tokenMutation = usePracticeConversationToken();
  const addTurn = useAddPracticeTurn();
  const completeSession = useCompletePracticeSession();
  const generateFeedback = useGeneratePracticeFeedback();

  const conversationRef = useRef<ElevenLabsConversation | null>(null);
  const seenEventIds = useRef(new Set<number>());
  const sequenceRef = useRef(0);

  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    const answerId = Number(new URLSearchParams(window.location.search).get("answerId"));
    return Number.isFinite(answerId) && answerId > 0 ? [answerId] : [];
  });
  const [targetRole, setTargetRole] = useState("");
  const [targetCompanyName, setTargetCompanyName] = useState("");
  const [mode, setMode] = useState<"behavioral" | "company" | "story_focus">("behavioral");
  const [activeSession, setActiveSession] = useState<PracticeSession | null>(null);
  const [latestFeedbackSession, setLatestFeedbackSession] = useState<PracticeSession | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [status, setStatus] = useState<Status>("disconnected");
  const [agentMode, setAgentMode] = useState<Mode | "idle">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const experienceMap = useMemo(() => {
    const map = new Map<number, { title: string; organization: string }>();
    experiences?.forEach(exp => map.set(exp.id, { title: exp.title, organization: exp.organization }));
    return map;
  }, [experiences]);

  const isConnected = status === "connected" || status === "connecting";
  const isStarting = createSession.isPending || tokenMutation.isPending || status === "connecting";
  const selectedCount = selectedIds.length;
  const feedback = asFeedback(latestFeedbackSession?.feedback || activeSession?.feedback);
  const openingQuestionPreview = useMemo(() => {
    const selectedAnswer = answers?.find(answer => selectedIds.includes(answer.id));
    if (!selectedAnswer) return "";

    const competency = selectedAnswer.competency || "behavioral judgment";
    const role = targetRole.trim() || "the role";
    const company = targetCompanyName.trim();
    const situation = compactText(selectedAnswer.situation, 24);
    const action = compactText(selectedAnswer.action, 18);
    const result = compactText(selectedAnswer.result, 16);
    const storyFocus = [
      situation ? `where ${situation}` : null,
      action ? `and you had to ${action.charAt(0).toLowerCase()}${action.slice(1)}` : null,
      result ? `to drive ${result.charAt(0).toLowerCase()}${result.slice(1)}` : null,
    ].filter(Boolean).join(" ");

    if (company.toLowerCase().includes("amazon")) {
      const principle = inferAmazonLeadershipPrinciple(competency, role);
      return `Hi, I will run this like an Amazon ${role} behavioral interview. Let's start with Amazon's ${principle} leadership principle. In your resume, I noticed a ${competency.toLowerCase()} story ${storyFocus}. Tell me about that situation and how your choices demonstrated ${principle}.`;
    }

    if (company) {
      return `Hi, I will run this like a ${company} interview for ${role}. I noticed a ${competency.toLowerCase()} story in your resume ${storyFocus}. Walk me through that example and the impact you had.`;
    }

    return `Hi, I will run this like a behavioral interview for ${role}. I noticed a ${competency.toLowerCase()} story in your resume ${storyFocus}. Walk me through that example and the impact you had.`;
  }, [answers, selectedIds, targetCompanyName, targetRole]);

  useEffect(() => {
    if (!workspacePreferences) return;
    if (!targetRole && workspacePreferences.targetRole) {
      setTargetRole(workspacePreferences.targetRole);
    }
    if (!targetCompanyName && workspacePreferences.targetCompanyName) {
      setTargetCompanyName(workspacePreferences.targetCompanyName);
    }
  }, [targetCompanyName, targetRole, workspacePreferences]);

  const toggleAnswer = (answerId: number) => {
    setSelectedIds(current =>
      current.includes(answerId)
        ? current.filter(id => id !== answerId)
        : [...current, answerId]
    );
  };

  const recordTurn = (sessionId: number, speaker: "user" | "agent", text: string, eventId?: number) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    if (eventId !== undefined) {
      if (seenEventIds.current.has(eventId)) return;
      seenEventIds.current.add(eventId);
    }

    const sequence = sequenceRef.current;
    sequenceRef.current += 1;
    setTranscript(current => [...current, { speaker, text: cleanText, sequence }]);
    void addTurn.mutateAsync({
      sessionId,
      speaker,
      text: cleanText,
      sequence,
      metadata: eventId !== undefined ? { eventId } : undefined,
    }).catch(() => {
      toast({ title: "Transcript save failed", description: "One turn could not be saved.", variant: "destructive" });
    });
  };

  const handleStart = async () => {
    if (selectedIds.length === 0) {
      toast({ title: "Choose a story", description: "Select at least one STAR story before starting practice." });
      return;
    }

    setStartError(null);
    setTranscript([]);
    setLatestFeedbackSession(null);
    sequenceRef.current = 0;
    seenEventIds.current.clear();

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus("connecting");
      const session = await createSession.mutateAsync({
        selectedStarAnswerIds: selectedIds,
        mode,
        targetRole: targetRole.trim() || undefined,
        targetCompanyName: targetCompanyName.trim() || undefined,
      });
      setActiveSession(session);

      const tokenData = await tokenMutation.mutateAsync(session.id);
      const conversation = await Conversation.startSession({
        conversationToken: tokenData.token,
        connectionType: "webrtc",
        dynamicVariables: tokenData.dynamicVariables,
        userId: wsId,
        onConnect: () => {
          setStatus("connected");
          toast({ title: "Voice practice started", description: "Your interviewer is ready." });
        },
        onStatusChange: ({ status: nextStatus }) => setStatus(nextStatus),
        onModeChange: ({ mode: nextMode }) => setAgentMode(nextMode),
        onMessage: message => {
          const speaker = message.role === "agent" ? "agent" : "user";
          recordTurn(session.id, speaker, message.message, message.event_id);
        },
        onDisconnect: () => {
          setStatus("disconnected");
          setAgentMode("idle");
        },
        onError: (message) => {
          const errorMessage = typeof message === "string" ? message : "Voice practice encountered an error";
          setStartError(errorMessage);
          toast({ title: "Voice practice error", description: errorMessage, variant: "destructive" });
        },
      });

      conversationRef.current = conversation;
    } catch (err) {
      setStatus("disconnected");
      setAgentMode("idle");
      const message = err instanceof Error ? err.message : "Could not start voice practice";
      setStartError(message);
      toast({ title: "Could not start voice practice", description: message, variant: "destructive" });
    }
  };

  const handleEnd = async () => {
    const conversation = conversationRef.current;
    const conversationId = conversation?.getId();
    conversationRef.current = null;

    try {
      if (conversation) {
        await conversation.endSession();
      }

      setStatus("disconnected");
      setAgentMode("idle");

      if (activeSession) {
        const completed = await completeSession.mutateAsync({
          sessionId: activeSession.id,
          elevenLabsConversationId: conversationId,
        });
        setActiveSession(completed);

        if (sequenceRef.current > 0) {
          const feedbackSession = await generateFeedback.mutateAsync(activeSession.id);
          setLatestFeedbackSession(feedbackSession);
          setActiveSession(feedbackSession);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not end practice cleanly";
      toast({ title: "Practice end failed", description: message, variant: "destructive" });
    }
  };

  const handleMuteToggle = () => {
    const nextMuted = !isMuted;
    conversationRef.current?.setMicMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 text-primary p-2 rounded-xl">
                <Mic className="w-6 h-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Voice Practice</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-3xl">
              Practice behavioral interviews with an ElevenLabs voice agent using your STAR stories as private context.
            </p>
          </div>
          <Badge variant="outline" className="w-fit px-3 py-1.5">
            <Radio className="w-3.5 h-3.5 mr-2" />
            {status === "connected" ? `Live - agent ${agentMode}` : status}
          </Badge>
        </div>

        {startError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {startError}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
          <div className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Choose STAR stories
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  The interviewer can ask follow-ups about the stories you select, but it will not reveal your prepared answer.
                </p>
              </CardHeader>
              <CardContent>
                {answersLoading ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                    Loading your answer bank...
                  </div>
                ) : !answers || answers.length === 0 ? (
                  <div className="py-12 text-center border border-dashed rounded-xl bg-muted/20">
                    <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <h3 className="font-display font-semibold">No STAR stories yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generate STAR answers from an experience before starting voice practice.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {answers.map(answer => {
                      const exp = experienceMap.get(answer.experienceId);
                      const checked = selectedIds.includes(answer.id);
                      return (
                        <div
                          key={answer.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleAnswer(answer.id)}
                          onKeyDown={event => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              toggleAnswer(answer.id);
                            }
                          }}
                          className={`w-full cursor-pointer text-left rounded-xl border p-4 transition-all ${
                            checked ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 bg-card hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleAnswer(answer.id)}
                              onClick={event => event.stopPropagation()}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge variant="outline">{answer.competency}</Badge>
                                {exp && <span className="text-xs text-muted-foreground">{exp.title} at {exp.organization}</span>}
                              </div>
                              {checked ? (
                                <div className="mt-3 grid gap-3 text-sm">
                                  {[
                                    ["Situation", answer.situation],
                                    ["Task", answer.task],
                                    ["Action", answer.action],
                                    ["Result", answer.result],
                                  ].map(([label, text]) => (
                                    <div key={label} className="rounded-lg bg-background/70 border border-border/50 p-3">
                                      <div className="text-[10px] uppercase tracking-wide text-primary font-semibold mb-1">{label}</div>
                                      <p className="text-muted-foreground leading-relaxed">{text}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                  {answer.situation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Interview context</CardTitle>
                <p className="text-sm text-muted-foreground">
                  These details shape the questions for the selected stories above. They do not create a separate set of stories.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-foreground">Target role</label>
                  <Input
                    className="mt-2"
                    placeholder="e.g. Product manager intern, software engineer, consulting analyst"
                    value={targetRole}
                    onChange={event => setTargetRole(event.target.value)}
                    disabled={isConnected}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Target company</label>
                  <Input
                    className="mt-2"
                    placeholder="e.g. Amazon, Google, Stripe"
                    value={targetCompanyName}
                    onChange={event => setTargetCompanyName(event.target.value)}
                    disabled={isConnected}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Used to personalize the interviewer's first question, such as Amazon leadership principles.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Practice mode</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {[
                      { value: "behavioral", label: "General behavioral" },
                      { value: "story_focus", label: "Story deep dive" },
                      { value: "company", label: "Company style" },
                    ].map(option => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={mode === option.value ? "default" : "outline"}
                        onClick={() => setMode(option.value as typeof mode)}
                        disabled={isConnected}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/60 shadow-sm sticky top-6">
              <CardHeader>
                <CardTitle>Voice session</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedCount} {selectedCount === 1 ? "story" : "stories"} selected
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {openingQuestionPreview && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-primary font-semibold mb-2">Opening question preview</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{openingQuestionPreview}</p>
                    <p className="text-xs text-muted-foreground mt-3">
                      If the agent says something different, set the ElevenLabs agent First Message to {"{{opening_question}}"}.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  {!isConnected ? (
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={handleStart}
                      disabled={isStarting || selectedCount === 0 || !answers?.length}
                      data-testid="button-start-voice-practice"
                    >
                      {isStarting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
                      Start practice
                    </Button>
                  ) : (
                    <>
                      <Button size="lg" variant="outline" onClick={handleMuteToggle} className="flex-1">
                        {isMuted ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
                        {isMuted ? "Unmute" : "Mute"}
                      </Button>
                      <Button size="lg" variant="destructive" onClick={handleEnd} disabled={completeSession.isPending}>
                        <PhoneOff className="w-5 h-5 mr-2" />
                        End
                      </Button>
                    </>
                  )}
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">Live transcript</div>
                  <ScrollArea className="h-[300px] pr-3">
                    {transcript.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Transcript turns will appear here after the interviewer and candidate speak.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {transcript.map(turn => (
                          <div key={turn.sequence} className={turn.speaker === "agent" ? "text-left" : "text-right"}>
                            <div className={`inline-block rounded-2xl px-3 py-2 text-sm max-w-[90%] ${
                              turn.speaker === "agent"
                                ? "bg-card border border-border/60 text-foreground"
                                : "bg-primary text-primary-foreground"
                            }`}>
                              <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">
                                {turn.speaker === "agent" ? "Interviewer" : "You"}
                              </div>
                              {turn.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {feedback && (
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Practice feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {feedback.summary && <p className="text-foreground/80 leading-relaxed">{feedback.summary}</p>}

              {feedback.scores && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(feedback.scores).map(([label, score]) => (
                    <div key={label} className="bg-card rounded-xl border border-border/60 p-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label.replace(/([A-Z])/g, " $1")}</div>
                      <div className="text-2xl font-display font-bold text-primary mt-1">{score}/5</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {feedback.strengths && feedback.strengths.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Strengths</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      {feedback.strengths.map(item => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {feedback.improvements && feedback.improvements.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Improvements</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      {feedback.improvements.map(item => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {feedback.nextQuestion && (
                <div className="bg-card rounded-xl border border-border/60 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">Practice next</div>
                  <p>{feedback.nextQuestion}</p>
                </div>
              )}

              {feedback.recommendedRewrite && (
                <div className="bg-card rounded-xl border border-border/60 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">Suggested rewrite</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feedback.recommendedRewrite}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {sessions && sessions.length > 0 && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Recent practice sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.slice(0, 5).map(session => {
                  const ids = selectedAnswerIds(session.selectedStarAnswerIds);
                  return (
                    <div key={session.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-border/60 bg-card p-4">
                      <div>
                        <div className="font-medium">Session #{session.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {session.status} - {ids.length} {ids.length === 1 ? "story" : "stories"}
                          {session.targetRole ? ` - ${session.targetRole}` : ""}
                        </div>
                      </div>
                      {session.transcriptSummary && (
                        <p className="text-sm text-muted-foreground max-w-xl">{session.transcriptSummary}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

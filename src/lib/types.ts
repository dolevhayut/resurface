// Domain model — mirrors the PRD entities (§10). Every business record carries tenantId.

export type Role = "admin" | "recruiter" | "hiring_manager";

export type Verdict = "SUPPORTED" | "CONTRADICTED" | "INSUFFICIENT_EVIDENCE";

export type EvidenceStatus =
  | "supported" // verdict SUPPORTED + exact source line
  | "contradicted" // verdict CONTRADICTED + exact source line
  | "not_established" // INSUFFICIENT_EVIDENCE
  | "needs_verification"; // verdict without a valid source line

export interface ResumeLine {
  id: string; // L000
  text: string;
}

export interface Candidate {
  id: string;
  tenantId: string;
  name: string;
  headline: string;
  location: string;
  email?: string;
  version: number;
  contentHash: string;
  lines: ResumeLine[];
  language: "en" | "he";
  parseStatus: "ok" | "failed";
  parseError?: string;
  source: string; // file name / csv row
  importId: string;
  updatedAt: string; // last CV update
  createdAt: string;
  deletedAt?: string;
  demo: boolean;
}

export interface ImportRecord {
  id: string;
  tenantId: string;
  createdAt: string;
  createdBy: string;
  files: number;
  created: number;
  updated: number;
  duplicates: number;
  failed: number;
  items: { source: string; status: "created" | "updated" | "duplicate" | "failed"; candidateId?: string; message?: string }[];
}

export interface Job {
  id: string;
  tenantId: string;
  title: string;
  team: string;
  location: string;
  description: string;
  status: "open" | "closed";
  createdAt: string;
  demo: boolean;
}

export type CriterionKind = "semantic" | "computed_years";

export interface Criterion {
  id: string;
  label: string; // short title
  question: string; // full atomic question sent to the evaluator
  requirement: "must" | "nice";
  weight: number;
  evidenceRule: string;
  sourceJobSpan: string | null; // null → added manually, not in JD
  kind: CriterionKind;
  minYears?: number;
  stage: 1 | 2;
  flagged?: string; // e.g. manual criterion or protected attribute warning
}

export interface RubricVersion {
  id: string;
  tenantId: string;
  jobId: string;
  version: number;
  status: "draft" | "approved";
  criteria: Criterion[];
  hash: string;
  draftedBy: string; // provider that drafted
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export type TaskState =
  | "queued"
  | "leased"
  | "running"
  | "completed"
  | "retry_wait"
  | "failed"
  | "cancelled";

export interface Task {
  id: string;
  runId: string;
  candidateId: string;
  candidateVersion: number;
  stage: 1 | 2;
  state: TaskState;
  attempts: number;
  idempotencyKey: string;
  notBefore?: number;
  leaseUntil?: number;
  error?: string;
  skipped?: string; // stage-2 pruning reason
}

export type RunStatus = "running" | "paused" | "completed" | "cancelled" | "budget_stopped";

export interface Run {
  id: string;
  tenantId: string;
  jobId: string;
  rubricId: string;
  rubricHash: string;
  snapshot: { candidateId: string; version: number }[]; // frozen, sorted
  provider: string;
  model: string;
  status: RunStatus;
  budgetUsd: number;
  spentUsd: number;
  inputTokens: number;
  outputTokens: number;
  calls: number;
  pruneContradicted: boolean;
  auditSampleRate: number;
  createdAt: string;
  createdBy: string;
  finishedAt?: string;
}

export interface CriterionResult {
  criterionId: string;
  verdict: Verdict;
  probabilities: Record<string, number>;
  confidence: number; // provider confidence — details only, never a match %
  evidenceStatus: EvidenceStatus;
  evidenceLineId: string | null;
  evidenceText: string | null; // exact copy of source line
  evidenceProbability: number | null;
  computed?: string; // for computed criteria: explanation
}

export interface Evaluation {
  id: string;
  tenantId: string;
  runId: string;
  candidateId: string;
  candidateVersion: number;
  stage: 1 | 2;
  idempotencyKey: string;
  provider: string;
  model: string;
  results: CriterionResult[];
  usage: { input: number; output: number };
  createdAt: string;
}

export interface Shortlist {
  id: string;
  tenantId: string;
  jobId: string;
  name: string;
  createdAt: string;
  members: { candidateId: string; runId: string; addedAt: string; addedBy: string; note?: string }[];
}

export interface Feedback {
  id: string;
  tenantId: string;
  runId: string;
  candidateId: string;
  reason: string;
  createdAt: string;
  by: string;
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail?: string;
}

export interface UsageEvent {
  id: string;
  tenantId: string;
  at: string;
  runId?: string;
  purpose: "evaluation" | "rubric_draft" | "pool_query" | "reverse_match";
  provider: string;
  model: string;
  input: number;
  output: number;
  usd: number;
}

export interface DB {
  meta: { seededAt: string; schema: number };
  organizations: { id: string; name: string }[];
  candidates: Candidate[];
  imports: ImportRecord[];
  jobs: Job[];
  rubrics: RubricVersion[];
  runs: Run[];
  tasks: Task[];
  evaluations: Evaluation[];
  shortlists: Shortlist[];
  feedback: Feedback[];
  audit: AuditEvent[];
  usage: UsageEvent[];
}

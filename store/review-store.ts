import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import localforage from "localforage";
import { nanoid } from "nanoid";
import {
  InvestigationState,
  Claim,
  Source,
  ClaimSourceLink,
  SourceRelationship,
  ReviewStatus,
  ClaimQuestion,
  ClaimLinkType,
  InvestigationSuggestion,
  InvestigationSearchRun,
} from "../lib/types";
import { SearchResponse, getMatchBucket } from "../lib/search/types";
import { canonicalizeUrl } from "../lib/search/canonicalize";
import { splitStatements } from "../lib/analysis/splitter";
import { detectFeatures } from "../lib/analysis/highlights";
import { suggestQuestions } from "../lib/analysis/questions";
import { createDemoState } from "../data/demo";

// Non-persisted save indicator store to prevent infinite render/write cycles
interface SaveIndicatorState {
  lastSavedAt: string | null;
  saveError: string | null;
  setSaved: (timestamp: string) => void;
  setError: (err: string) => void;
}

export const useSaveIndicator = create<SaveIndicatorState>((set) => ({
  lastSavedAt: null,
  saveError: null,
  setSaved: (timestamp) => set({ lastSavedAt: timestamp, saveError: null }),
  setError: (err) => set({ saveError: err }),
}));

// Client-safe localforage storage wrapper
const clientStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    try {
      return await localforage.getItem<string>(name);
    } catch {
      return localStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      await localforage.setItem(name, value);
      useSaveIndicator.getState().setSaved(new Date().toLocaleTimeString());
    } catch {
      try {
        localStorage.setItem(name, value);
        useSaveIndicator.getState().setSaved(new Date().toLocaleTimeString());
      } catch {
        useSaveIndicator.getState().setError("Failed to save locally. Storage may be full.");
      }
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      await localforage.removeItem(name);
    } catch {
      localStorage.removeItem(name);
    }
  },
};

// URL validation helper (http/https only)
export function isValidUrl(url?: string): boolean {
  if (!url || url.trim() === "") return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export interface ReviewStore extends InvestigationState {
  // Actions
  createInvestigation: (params: {
    originalText: string;
    initialSource?: {
      title?: string;
      publisher?: string;
      url?: string;
      sourceType?: Source["sourceType"];
      publishedAt?: string;
    };
  }) => void;
  reorderClaims: (startIndex: number, endIndex: number) => void;
  addClaim: (text: string) => void;
  editClaimText: (claimId: string, text: string) => void;
  splitClaim: (claimId: string, cursorIndex: number) => void;
  mergeClaims: (claimIdA: string, claimIdB: string) => void;
  deleteClaim: (claimId: string) => void;

  toggleChecklist: (claimId: string, item: keyof Claim["checklist"]) => void;
  setClaimStatus: (claimId: string, status: ReviewStatus) => void;
  setClaimNotes: (claimId: string, notes: string) => void;
  setClaimReferenceUrl: (claimId: string, url: string) => void;
  promoteReferenceUrlToSource: (claimId: string) => void;

  updateClaimQuestion: (
    claimId: string,
    questionId: string,
    patch: Partial<ClaimQuestion>
  ) => void;
  refreshClaimQuestions: (claimId: string) => void;
  dismissGap: (
    claimId: string,
    ruleId: string,
    sourceId: string | undefined,
    reason: string
  ) => void;

  addSource: (source: Omit<Source, "id">) => string;
  editSource: (id: string, patch: Partial<Source>) => void;
  deleteSource: (id: string) => void;

  addClaimSourceLink: (link: Omit<ClaimSourceLink, "id">) => void;
  editClaimSourceLink: (id: string, patch: Partial<ClaimSourceLink>) => void;
  deleteClaimSourceLink: (id: string) => void;

  addSourceRelationship: (rel: Omit<SourceRelationship, "id">) => void;
  editSourceRelationship: (id: string, patch: Partial<SourceRelationship>) => void;
  deleteSourceRelationship: (id: string) => void;

  updateWordingReview: (
    observationId: string,
    reviewState: "unconfirmed" | "confirmed" | "dismissed",
    note?: string
  ) => void;

  setNodePosition: (nodeId: string, pos: { x: number; y: number }) => void;
  resetNodePositions: () => void;

  addSearchRun: (response: SearchResponse, claimId?: string) => void;
  confirmSuggestion: (
    suggestionId: string,
    payload: { claimIds: string[]; linkType: ClaimLinkType; notes?: string }
  ) => string | undefined;
  dismissSuggestion: (suggestionId: string) => void;
  restoreSuggestion: (suggestionId: string) => void;
  clearSuggestions: () => void;

  loadDemo: () => void;
  resetInvestigation: () => void;
  importState: (newState: InvestigationState) => boolean;
}

export function migratePersistedState(persistedState: unknown, version: number) {
  if (version < 2) {
    const s = persistedState as Record<string, unknown> | null | undefined;
    return {
      ...(s || {}),
      suggestions: (s?.suggestions as unknown[]) || [],
      searchRuns: (s?.searchRuns as unknown[]) || [],
    };
  }
  return persistedState as Record<string, unknown>;
}

const initialEmptyState: InvestigationState = {
  investigation: null,
  claims: [],
  sources: [],
  claimSourceLinks: [],
  sourceRelationships: [],
  wordingReviews: {},
  suggestions: [],
  searchRuns: [],
  ui: {
    nodePositions: {},
  },
};

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      ...initialEmptyState,

      createInvestigation: ({ originalText, initialSource }) => {
        const invId = nanoid();
        const now = new Date().toISOString();

        // Rule-based statement splitting
        const splits = splitStatements(originalText);
        const claims: Claim[] = splits.map((s, idx) => {
          const highlights = detectFeatures(s.text);
          const questions = suggestQuestions(s.text, highlights);
          return {
            id: nanoid(),
            investigationId: invId,
            text: s.text,
            order: idx,
            textRevision: 1,
            originSpan: { start: s.start, end: s.end },
            status: "not_checked",
            statusHistory: [{ status: "not_checked", at: now }],
            checklist: {
              source: false,
              date: false,
              evidence: false,
              context: false,
              corroboration: false,
            },
            notes: "",
            questions,
            dismissedGaps: [],
          };
        });

        const sources: Source[] = [];
        const claimSourceLinks: ClaimSourceLink[] = [];

        // If initial source provided, create it as the first record
        if (initialSource && (initialSource.title || initialSource.url)) {
          const srcId = nanoid();
          const cleanUrl = isValidUrl(initialSource.url) ? initialSource.url : undefined;
          sources.push({
            id: srcId,
            title: initialSource.title?.trim() || "Initial Source Record",
            publisher: initialSource.publisher?.trim() || "Unspecified Publisher",
            sourceType: initialSource.sourceType || "other",
            url: cleanUrl,
            publishedAt: initialSource.publishedAt || null,
            datePrecision: initialSource.publishedAt ? "day" : "unknown",
            excerpt: originalText.slice(0, 300),
            notes: "Recorded during investigation setup.",
            isPrimaryMarkedByReviewer: false,
          });

          // Link to first claim as not_established
          if (claims.length > 0) {
            claimSourceLinks.push({
              id: nanoid(),
              claimId: claims[0].id,
              sourceId: srcId,
              type: "not_established",
              notes: "Initial record linked pending detailed review.",
              excerptRelevance: "not_assessed",
              scopeMismatch: "not_assessed",
              assessedAtClaimRevision: 1,
            });
          }
        }

        set({
          investigation: {
            id: invId,
            originalText,
            createdAt: now,
            updatedAt: now,
            isDemo: false,
            schemaVersion: 1,
          },
          claims,
          sources,
          claimSourceLinks,
          sourceRelationships: [],
          wordingReviews: {},
          ui: { nodePositions: {} },
        });
      },

      reorderClaims: (startIndex, endIndex) => {
        set((state) => {
          const newClaims = [...state.claims];
          const [moved] = newClaims.splice(startIndex, 1);
          newClaims.splice(endIndex, 0, moved);
          newClaims.forEach((c, i) => {
            c.order = i;
          });
          return { claims: newClaims };
        });
      },

      addClaim: (text) => {
        set((state) => {
          if (!state.investigation) return state;
          const hl = detectFeatures(text);
          const q = suggestQuestions(text, hl);
          const newClaim: Claim = {
            id: nanoid(),
            investigationId: state.investigation.id,
            text: text.trim(),
            order: state.claims.length,
            textRevision: 1,
            originSpan: null,
            status: "not_checked",
            statusHistory: [{ status: "not_checked", at: new Date().toISOString() }],
            checklist: {
              source: false,
              date: false,
              evidence: false,
              context: false,
              corroboration: false,
            },
            notes: "",
            questions: q,
            dismissedGaps: [],
          };
          return { claims: [...state.claims, newClaim] };
        });
      },

      editClaimText: (claimId, text) => {
        set((state) => {
          const claims = state.claims.map((c) => {
            if (c.id === claimId) {
              return {
                ...c,
                text: text.trim(),
                textRevision: c.textRevision + 1,
                originSpan: null,
              };
            }
            return c;
          });
          return { claims };
        });
      },

      splitClaim: (claimId, cursorIndex) => {
        set((state) => {
          const claimIndex = state.claims.findIndex((c) => c.id === claimId);
          if (claimIndex === -1) return state;
          const original = state.claims[claimIndex];

          const part1Text = original.text.slice(0, cursorIndex).trim();
          const part2Text = original.text.slice(cursorIndex).trim();

          if (!part1Text || !part2Text) return state;

          const updatedOriginal: Claim = {
            ...original,
            text: part1Text,
            textRevision: original.textRevision + 1,
            originSpan: null,
          };

          const hl2 = detectFeatures(part2Text);
          const q2 = suggestQuestions(part2Text, hl2);
          const newClaim: Claim = {
            id: nanoid(),
            investigationId: original.investigationId,
            text: part2Text,
            order: original.order + 1,
            textRevision: 1,
            originSpan: null,
            status: "not_checked",
            statusHistory: [{ status: "not_checked", at: new Date().toISOString() }],
            checklist: {
              source: false,
              date: false,
              evidence: false,
              context: false,
              corroboration: false,
            },
            notes: "",
            questions: q2,
            dismissedGaps: [],
          };

          const newClaims = [...state.claims];
          newClaims.splice(claimIndex, 1, updatedOriginal, newClaim);
          newClaims.forEach((c, i) => (c.order = i));

          return { claims: newClaims };
        });
      },

      mergeClaims: (claimIdA, claimIdB) => {
        set((state) => {
          const cA = state.claims.find((c) => c.id === claimIdA);
          const cB = state.claims.find((c) => c.id === claimIdB);
          if (!cA || !cB) return state;

          const mergedText = `${cA.text} ${cB.text}`.trim();
          const mergedRevision = Math.max(cA.textRevision, cB.textRevision) + 1;
          const mergedStatus: ReviewStatus =
            cA.status === cB.status ? cA.status : "needs_verification";

          const mergedChecklist = {
            source: cA.checklist.source && cB.checklist.source,
            date: cA.checklist.date && cB.checklist.date,
            evidence: cA.checklist.evidence && cB.checklist.evidence,
            context: cA.checklist.context && cB.checklist.context,
            corroboration: cA.checklist.corroboration && cB.checklist.corroboration,
          };

          const mergedNotes = [cA.notes, cB.notes].filter(Boolean).join("\n---\n");

          const mergedClaim: Claim = {
            ...cA,
            text: mergedText,
            textRevision: mergedRevision,
            originSpan: null,
            status: mergedStatus,
            checklist: mergedChecklist,
            notes: mergedNotes,
            questions: [...cA.questions, ...cB.questions],
            dismissedGaps: [...cA.dismissedGaps, ...cB.dismissedGaps],
          };

          // Re-link sources: move B's links to A
          const existingSourceIdsInA = new Set(
            state.claimSourceLinks
              .filter((l) => l.claimId === claimIdA)
              .map((l) => l.sourceId)
          );

          const updatedLinks: ClaimSourceLink[] = [];
          for (const link of state.claimSourceLinks) {
            if (link.claimId === claimIdA) {
              updatedLinks.push(link);
            } else if (link.claimId === claimIdB) {
              if (existingSourceIdsInA.has(link.sourceId)) {
                // Duplicate link: keep first, append note
                const existing = updatedLinks.find(
                  (l) => l.claimId === claimIdA && l.sourceId === link.sourceId
                );
                if (existing) {
                  existing.notes = `${existing.notes} (Merged note: ${link.notes})`.trim();
                }
              } else {
                updatedLinks.push({
                  ...link,
                  claimId: claimIdA,
                  assessedAtClaimRevision: mergedRevision - 1, // mark stale
                });
              }
            } else {
              updatedLinks.push(link);
            }
          }

          const filteredClaims = state.claims
            .filter((c) => c.id !== claimIdB)
            .map((c) => (c.id === claimIdA ? mergedClaim : c));
          filteredClaims.forEach((c, idx) => (c.order = idx));

          return {
            claims: filteredClaims,
            claimSourceLinks: updatedLinks,
          };
        });
      },

      deleteClaim: (claimId) => {
        set((state) => ({
          claims: state.claims
            .filter((c) => c.id !== claimId)
            .map((c, idx) => ({ ...c, order: idx })),
          claimSourceLinks: state.claimSourceLinks.filter((l) => l.claimId !== claimId),
        }));
      },

      toggleChecklist: (claimId, item) => {
        set((state) => ({
          claims: state.claims.map((c) => {
            if (c.id === claimId) {
              return {
                ...c,
                checklist: {
                  ...c.checklist,
                  [item]: !c.checklist[item],
                },
              };
            }
            return c;
          }),
        }));
      },

      setClaimStatus: (claimId, status) => {
        set((state) => ({
          claims: state.claims.map((c) => {
            if (c.id === claimId) {
              return {
                ...c,
                status,
                statusHistory: [
                  ...c.statusHistory,
                  { status, at: new Date().toISOString() },
                ],
              };
            }
            return c;
          }),
        }));
      },

      setClaimNotes: (claimId, notes) => {
        set((state) => ({
          claims: state.claims.map((c) => (c.id === claimId ? { ...c, notes } : c)),
        }));
      },

      setClaimReferenceUrl: (claimId, referenceUrl) => {
        if (!isValidUrl(referenceUrl)) return;
        set((state) => ({
          claims: state.claims.map((c) =>
            c.id === claimId ? { ...c, referenceUrl } : c
          ),
        }));
      },

      promoteReferenceUrlToSource: (claimId) => {
        const state = get();
        const claim = state.claims.find((c) => c.id === claimId);
        if (!claim || !claim.referenceUrl) return;

        const newSrcId = nanoid();
        const newSource: Source = {
          id: newSrcId,
          title: `Source from ${new URL(claim.referenceUrl).hostname}`,
          publisher: new URL(claim.referenceUrl).hostname,
          sourceType: "other",
          url: claim.referenceUrl,
          publishedAt: null,
          datePrecision: "unknown",
          excerpt: "",
          notes: `Promoted from reference URL note on statement: "${claim.text.slice(0, 60)}..."`,
          isPrimaryMarkedByReviewer: false,
        };

        const newLink: ClaimSourceLink = {
          id: nanoid(),
          claimId: claim.id,
          sourceId: newSrcId,
          type: "not_established",
          notes: "Promoted from reference URL note.",
          excerptRelevance: "not_assessed",
          scopeMismatch: "not_assessed",
          assessedAtClaimRevision: claim.textRevision,
        };

        set({
          sources: [...state.sources, newSource],
          claimSourceLinks: [...state.claimSourceLinks, newLink],
          claims: state.claims.map((c) =>
            c.id === claimId ? { ...c, referenceUrl: undefined } : c
          ),
        });
      },

      updateClaimQuestion: (claimId, questionId, patch) => {
        set((state) => ({
          claims: state.claims.map((c) => {
            if (c.id === claimId) {
              return {
                ...c,
                questions: c.questions.map((q) =>
                  q.id === questionId ? { ...q, ...patch, edited: true } : q
                ),
              };
            }
            return c;
          }),
        }));
      },

      refreshClaimQuestions: (claimId) => {
        set((state) => ({
          claims: state.claims.map((c) => {
            if (c.id === claimId) {
              const hl = detectFeatures(c.text);
              const newSuggestions = suggestQuestions(c.text, hl);
              const existingAnchorTexts = new Set(c.questions.map((q) => q.anchorText));
              const freshToAdd = newSuggestions.filter(
                (q) => !existingAnchorTexts.has(q.anchorText)
              );
              return {
                ...c,
                questions: [...c.questions, ...freshToAdd],
              };
            }
            return c;
          }),
        }));
      },

      dismissGap: (claimId, ruleId, sourceId, reason) => {
        set((state) => ({
          claims: state.claims.map((c) => {
            if (c.id === claimId) {
              return {
                ...c,
                dismissedGaps: [
                  ...c.dismissedGaps,
                  { ruleId, sourceId, reason, at: new Date().toISOString() },
                ],
              };
            }
            return c;
          }),
        }));
      },

      addSource: (sourceData) => {
        if (!isValidUrl(sourceData.url)) {
          throw new Error("Invalid URL protocol. Only http: and https: are allowed.");
        }
        const srcId = nanoid();
        const newSource: Source = {
          ...sourceData,
          id: srcId,
        };
        set((state) => ({
          sources: [...state.sources, newSource],
        }));
        return srcId;
      },

      editSource: (id, patch) => {
        if (patch.url && !isValidUrl(patch.url)) {
          throw new Error("Invalid URL protocol. Only http: and https: are allowed.");
        }
        set((state) => ({
          sources: state.sources.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }));
      },

      deleteSource: (id) => {
        set((state) => ({
          sources: state.sources.filter((s) => s.id !== id),
          claimSourceLinks: state.claimSourceLinks.filter((l) => l.sourceId !== id),
          sourceRelationships: state.sourceRelationships.filter(
            (r) => r.fromSourceId !== id && r.toSourceId !== id
          ),
        }));
      },

      addClaimSourceLink: (linkData) => {
        set((state) => {
          // Check for existing link between this claim and source
          const existing = state.claimSourceLinks.find(
            (l) => l.claimId === linkData.claimId && l.sourceId === linkData.sourceId
          );
          if (existing) {
            // Update existing instead of creating duplicate
            return {
              claimSourceLinks: state.claimSourceLinks.map((l) =>
                l.id === existing.id ? { ...l, ...linkData } : l
              ),
            };
          }
          const claim = state.claims.find((c) => c.id === linkData.claimId);
          const newLink: ClaimSourceLink = {
            ...linkData,
            id: nanoid(),
            assessedAtClaimRevision: claim ? claim.textRevision : 1,
          };
          return {
            claimSourceLinks: [...state.claimSourceLinks, newLink],
          };
        });
      },

      editClaimSourceLink: (id, patch) => {
        set((state) => ({
          claimSourceLinks: state.claimSourceLinks.map((l) =>
            l.id === id ? { ...l, ...patch } : l
          ),
        }));
      },

      deleteClaimSourceLink: (id) => {
        set((state) => ({
          claimSourceLinks: state.claimSourceLinks.filter((l) => l.id !== id),
        }));
      },

      addSourceRelationship: (relData) => {
        if (relData.fromSourceId === relData.toSourceId) {
          throw new Error("Self-relationships are not allowed.");
        }
        set((state) => {
          // Canonical ordering check for undirected types
          let from = relData.fromSourceId;
          let to = relData.toSourceId;
          if (
            relData.type === "possible_shared_origin" ||
            relData.type === "unknown" ||
            relData.type === "reviewer_judged_independent"
          ) {
            if (from > to) {
              const temp = from;
              from = to;
              to = temp;
            }
          }

          // Check for existing duplicate (from, to, type)
          const dup = state.sourceRelationships.find(
            (r) => r.fromSourceId === from && r.toSourceId === to && r.type === relData.type
          );
          if (dup) return state;

          const newRel: SourceRelationship = {
            ...relData,
            id: nanoid(),
            fromSourceId: from,
            toSourceId: to,
          };
          return {
            sourceRelationships: [...state.sourceRelationships, newRel],
          };
        });
      },

      editSourceRelationship: (id, patch) => {
        set((state) => ({
          sourceRelationships: state.sourceRelationships.map((r) =>
            r.id === id ? { ...r, ...patch } : r
          ),
        }));
      },

      deleteSourceRelationship: (id) => {
        set((state) => ({
          sourceRelationships: state.sourceRelationships.filter((r) => r.id !== id),
        }));
      },

      updateWordingReview: (observationId, reviewState, note) => {
        set((state) => ({
          wordingReviews: {
            ...state.wordingReviews,
            [observationId]: { reviewState, note },
          },
        }));
      },

      setNodePosition: (nodeId, pos) => {
        set((state) => ({
          ui: {
            ...state.ui,
            nodePositions: {
              ...state.ui.nodePositions,
              [nodeId]: pos,
            },
          },
        }));
      },

      resetNodePositions: () => {
        set((state) => ({
          ui: { ...state.ui, nodePositions: {} },
        }));
      },

      addSearchRun: (response, claimId) => {
        const runId = nanoid();
        const newRun: InvestigationSearchRun = {
          id: runId,
          ranAt: new Date().toISOString(),
          claimId,
          provider: response.provider,
          mock: response.mock,
          coverage: response.coverage,
          queries: response.queries,
        };

        const existingSourceUrls = new Set(
          get().sources.map((s) => (s.url ? canonicalizeUrl(s.url) : ""))
        );
        const existingSuggestionUrls = new Set(
          get().suggestions.map((s) => s.canonicalUrl)
        );

        const newSuggestions: InvestigationSuggestion[] = [];
        for (const s of response.suggestions) {
          const canon = canonicalizeUrl(s.url);
          if (!canon || existingSourceUrls.has(canon) || existingSuggestionUrls.has(canon)) {
            continue;
          }
          existingSuggestionUrls.add(canon);
          newSuggestions.push({
            id: nanoid(),
            canonicalUrl: canon,
            data: s,
            status: "suggested",
            runId,
          });
        }

        set((state) => {
          let combined = [...state.suggestions, ...newSuggestions];
          if (combined.length > 100) {
            // drop oldest dismissed first
            const dismissedIndices: number[] = [];
            combined.forEach((item, idx) => {
              if (item.status === "dismissed") dismissedIndices.push(idx);
            });
            const toDrop = combined.length - 100;
            const dropSet = new Set(dismissedIndices.slice(0, toDrop));
            combined = combined.filter((_, idx) => !dropSet.has(idx));
            if (combined.length > 100) {
              combined = combined.slice(combined.length - 100);
            }
          }

          const updatedRuns = [...state.searchRuns, newRun].slice(-10);

          return {
            suggestions: combined,
            searchRuns: updatedRuns,
          };
        });
      },

      confirmSuggestion: (suggestionId, payload) => {
        const state = get();
        const suggestion = state.suggestions.find((s) => s.id === suggestionId);
        if (!suggestion) return;

        const run = state.searchRuns.find((r) => r.id === suggestion.runId);
        const fromMock = run?.mock ?? suggestion.data.title.startsWith("[MOCK]");

        // Mock data rule: results with fromMock can be confirmed ONLY when investigation isDemo
        if (fromMock && !state.investigation?.isDemo) {
          throw new Error("Mock data cannot be added to a real investigation.");
        }

        const sourceId = nanoid();
        const newSource: Source = {
          id: sourceId,
          title: suggestion.data.title,
          publisher: suggestion.data.publisher,
          sourceType: suggestion.data.sourceType,
          url: suggestion.data.url,
          publishedAt: suggestion.data.publishedAt,
          datePrecision: suggestion.data.datePrecision,
          dateNote: suggestion.data.dateNote,
          excerpt: suggestion.data.excerpt,
          notes: payload.notes || "",
          isPrimaryMarkedByReviewer: false,
          origin: "search_confirmed",
          suggestionMeta: {
            matchedQueries: suggestion.data.matchedQueries,
            matchBucket: getMatchBucket(suggestion.data.matchStrength),
            classificationMethod: suggestion.data.classificationMethod,
            firstArchivedAt: suggestion.data.firstArchivedAt || null,
            fromMockData: fromMock,
          },
        };

        const newLinks: ClaimSourceLink[] = payload.claimIds.map((cId) => {
          const claim = state.claims.find((c) => c.id === cId);
          return {
            id: nanoid(),
            claimId: cId,
            sourceId,
            type: payload.linkType || "not_established",
            notes: "",
            excerptRelevance: "not_assessed",
            scopeMismatch: "not_assessed",
            assessedAtClaimRevision: claim ? claim.textRevision : 1,
          };
        });

        set((current) => ({
          sources: [...current.sources, newSource],
          claimSourceLinks: [...current.claimSourceLinks, ...newLinks],
          suggestions: current.suggestions.map((s) =>
            s.id === suggestionId ? { ...s, status: "confirmed" } : s
          ),
        }));

        return sourceId;
      },

      dismissSuggestion: (suggestionId) => {
        set((state) => ({
          suggestions: state.suggestions.map((s) =>
            s.id === suggestionId ? { ...s, status: "dismissed" } : s
          ),
        }));
      },

      restoreSuggestion: (suggestionId) => {
        set((state) => ({
          suggestions: state.suggestions.map((s) =>
            s.id === suggestionId ? { ...s, status: "suggested" } : s
          ),
        }));
      },

      clearSuggestions: () => {
        set({ suggestions: [], searchRuns: [] });
      },

      loadDemo: () => {
        const demoState = createDemoState();
        set(demoState);
      },

      resetInvestigation: () => {
        set(initialEmptyState);
      },

      importState: (newState) => {
        try {
          if (!newState.investigation || newState.investigation.schemaVersion !== 1) {
            return false;
          }
          set({
            investigation: newState.investigation,
            claims: newState.claims || [],
            sources: newState.sources || [],
            claimSourceLinks: newState.claimSourceLinks || [],
            sourceRelationships: newState.sourceRelationships || [],
            wordingReviews: newState.wordingReviews || {},
            suggestions: newState.suggestions || [],
            searchRuns: newState.searchRuns || [],
            ui: { nodePositions: newState.ui?.nodePositions || {} },
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "factify:v1",
      version: 2,
      migrate: migratePersistedState,
      storage: createJSONStorage(() => clientStorage),
      skipHydration: true,
      partialize: (state) => ({
        investigation: state.investigation,
        claims: state.claims,
        sources: state.sources,
        claimSourceLinks: state.claimSourceLinks,
        sourceRelationships: state.sourceRelationships,
        wordingReviews: state.wordingReviews,
        suggestions: state.suggestions,
        searchRuns: state.searchRuns,
        ui: {
          nodePositions: state.ui.nodePositions,
        },
      }),
    }
  )
);

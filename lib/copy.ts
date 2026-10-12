export const DISCLAIMER_TEXT =
  "Factify helps you organize and trace an evidence review. It does not independently prove or disprove a claim.";

export const STATUS_MICROCOPY =
  "Evidence found means you found material worth reviewing. It does not mean the claim is supported.";

export const TIMELINE_CAVEAT =
  "Chronological view. Order of dates alone does not show who copied whom.";

export const EARLIEST_RECORD_CAVEAT =
  "Oldest relevant record available here, not proof of where the claim began or when this exact wording first appeared.";

export const PRIVACY_NOTE = "Your text stays in this browser.";

export const NON_LATIN_NOTICE =
  "Rules are tuned for English. Review the breakdown manually.";

export const DEMO_BANNER_TEXT =
  "All records here are fictional, for interface demonstration only.";

export const MOCK_DATA_BANNER_TEXT =
  "MOCK DATA: fake results for testing only.";

export const LIMITATIONS_TEXT = [
  "Cannot crawl the web or execute live network searches at runtime.",
  "Cannot access private chat logs or restricted networks.",
  "Only works with user-entered or fictional demo records stored in this browser.",
  "Automated statement breakdown and heuristic cues are tuned for English.",
];

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  official_record: "Official Record",
  press_release: "Press Release",
  news_report: "News Report",
  social_post: "Social Post",
  messaging_forward: "Messaging Forward",
  blog_opinion: "Blog / Opinion",
  analysis: "Analysis / Report",
  other: "Other",
  unknown: "Unknown Type",
};

export const CLAIM_LINK_TYPE_LABELS: Record<string, { label: string; desc: string }> = {
  supports: {
    label: "Supports",
    desc: "Provides documented backing or firsthand record directly supporting statement",
  },
  contradicts: {
    label: "Contradicts",
    desc: "Provides findings or records in direct tension or counter-evidence",
  },
  contextualizes: {
    label: "Contextualizes",
    desc: "Adds background or nuance without confirming or denying core assertion",
  },
  repeats: {
    label: "Repeats without evidence",
    desc: "Restates or amplifies the claim without adding verifiable evidence",
  },
  unrelated: {
    label: "Unrelated",
    desc: "Record reviewed but does not meaningfully touch this statement",
  },
  not_established: {
    label: "Relationship not established",
    desc: "Reviewed but link status is pending or unclear",
  },
};

export const SOURCE_REL_TYPE_LABELS: Record<string, { label: string; desc: string }> = {
  explicitly_cites: {
    label: "Explicitly cites",
    desc: "Directly references, names, or links to the upstream source",
  },
  quotes: {
    label: "Quotes",
    desc: "Extracts verbatim quoted passages from the upstream source",
  },
  appears_to_repeat: {
    label: "Appears to repeat",
    desc: "Text strongly resembles upstream source without explicit attribution",
  },
  possible_shared_origin: {
    label: "Possible shared origin",
    desc: "Both sources appear to draw from a common unverified upstream origin",
  },
  reviewer_judged_independent: {
    label: "Reviewer judged independent",
    desc: "Reviewer assessment that these sources gathered material independently (not verified by Factify)",
  },
  unknown: {
    label: "Relationship unknown",
    desc: "Relationship between these two sources is uninvestigated or indeterminate",
  },
};

export const VERIFICATION_LABELS: Record<string, string> = {
  documented: "Documented",
  reviewer_suspected: "Reviewer suspected",
  unknown: "Unknown",
};

export const REVIEW_STATUS_LABELS: Record<string, { label: string; desc: string }> = {
  not_checked: {
    label: "Not checked",
    desc: "Investigation has not yet evaluated evidence for this statement",
  },
  evidence_found: {
    label: "Evidence found",
    desc: "Material worth reviewing has been located (does not mean statement is proven)",
  },
  needs_verification: {
    label: "Needs more verification",
    desc: "Material is ambiguous, contradictory, or lacks independent corroboration",
  },
};

export const CHECKLIST_ITEMS = [
  {
    key: "source" as const,
    label: "Source identified",
    hint: "Identify the author, publishing outlet, or original poster behind the assertion.",
  },
  {
    key: "date" as const,
    label: "Date verifiable",
    hint: "Establish when the material first surfaced rather than when it was forwarded.",
  },
  {
    key: "evidence" as const,
    label: "Direct evidence cited",
    hint: "Inspect whether actual records, primary data, or named witnesses are provided.",
  },
  {
    key: "context" as const,
    label: "Full context preserved",
    hint: "Ensure quotes or events are not truncated, out of timeframe, or stripped of qualifications.",
  },
  {
    key: "corroboration" as const,
    label: "Independent corroboration",
    hint: "Confirm whether supporting accounts originate separately or trace to the same root source.",
  },
];

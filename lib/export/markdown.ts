import { ReportModel } from "@/lib/derive/report";
import {
  CLAIM_LINK_TYPE_LABELS,
  SOURCE_REL_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
  CHECKLIST_ITEMS,
  LIMITATIONS_TEXT,
} from "@/lib/copy";

export function generateMarkdownReport(report: ReportModel): string {
  const lines: string[] = [];

  lines.push(`# ${report.title}`);
  lines.push(`Generated: ${report.generatedAt}`);

  // 1. Limitation + Disclaimer
  lines.push(`\n## 1. Operating Invariant, Disclaimer & Limitations\n`);
  lines.push(`> **Disclaimer:** ${report.disclaimer}\n`);
  lines.push(`**System Limitations:**`);
  LIMITATIONS_TEXT.forEach((lim) => lines.push(`- ${lim}`));
  lines.push("");

  if (report.hasMockData) {
    lines.push(`\n> **[CONTAINS MOCK DATA]** This report contains records confirmed from mock/simulated search results.\n`);
  }

  // 2. FICTIONAL DEMO watermark if demo
  if (report.isDemo) {
    lines.push(`## 2. Demonstration Status\n`);
    lines.push(`> **[FICTIONAL DEMO WATERMARK]** All records here are fictional, for interface demonstration only.\n`);
  } else {
    lines.push(`## 2. Demonstration Status\n`);
    lines.push(`User investigation (not a fictional demonstration dataset).\n`);
  }

  // 3. Original text verbatim
  lines.push(`## 3. Original Submitted Content (Verbatim & Immutable)\n`);
  lines.push(`\`\`\`\n${report.originalText}\n\`\`\`\n`);

  // 4. Scope
  lines.push(`## 4. Scope of Evidence Records\n`);
  lines.push(`- **Total Sources:** ${report.scopeSummary.totalSources}`);
  lines.push(`- **Dated Records:** ${report.scopeSummary.datedSources}`);
  lines.push(`- **Undated Records (Provisional):** ${report.scopeSummary.undatedSources}\n`);

  // 5. Claims with status / checklist / notes
  lines.push(`## 5. Decomposed Statements (Status, Checklist, Notes)\n`);
  report.claimsReport.forEach((item, idx) => {
    lines.push(`### Statement #${idx + 1}: "${item.claim.text}"`);
    lines.push(`- **Review Status:** ${item.claim.status.replace(/_/g, " ")}`);
    lines.push(`- **Reviewer Notes:** ${item.claim.notes || "(None provided)"}`);
    lines.push(`- **5-Point Checklist:**`);
    CHECKLIST_ITEMS.forEach((c) => {
      const isChecked = !!item.claim.checklist[c.key];
      lines.push(`  - [${isChecked ? "x" : " "}] ${c.label}`);
    });
    lines.push("");
  });

  // 6. Sources
  lines.push(`## 6. Recorded Evidence Sources\n`);
  if (report.sources.length === 0) {
    lines.push(`_No source records registered._\n`);
  } else {
    report.sources.forEach((s) => {
      lines.push(
        `### ${s.title}${s.isPrimaryMarkedByReviewer ? " [Primary (Reviewer-Marked)]" : ""}`
      );
      lines.push(`- **Date:** ${s.publishedAt || "Date unknown"}`);
      lines.push(`- **Type:** ${SOURCE_TYPE_LABELS[s.sourceType] || s.sourceType}`);
      if (s.origin === "search_confirmed") {
        lines.push(`- **Origin:** Added from search, reviewer-confirmed`);
        if (s.suggestionMeta) {
          lines.push(`- **Relevance Match:** ${s.suggestionMeta.matchBucket}`);
          lines.push(`- **Matched Queries:** ${s.suggestionMeta.matchedQueries.join(", ")}`);
          if (s.suggestionMeta.firstArchivedAt) {
            lines.push(`- **Archive Capture:** ${s.suggestionMeta.firstArchivedAt} (Wayback capture, not publication date)`);
          }
        }
      }
      if (s.url) lines.push(`- **URL:** ${s.url}`);
      if (s.excerpt) lines.push(`- **Excerpt:** "${s.excerpt}"`);
      if (s.notes) lines.push(`- **Notes:** ${s.notes}`);
      lines.push("");
    });
  }

  // 7. Claim-source links
  lines.push(`## 7. Claim-to-Source Links\n`);
  const allLinks = report.claimsReport.flatMap((c, i) =>
    c.links.map((l) => ({ claimIdx: i + 1, claimText: c.claim.text, ...l }))
  );
  if (allLinks.length === 0) {
    lines.push(`_No claim-to-source links recorded._\n`);
  } else {
    allLinks.forEach(({ claimIdx, link, source }) => {
      const typeLabel = CLAIM_LINK_TYPE_LABELS[link.type]?.label || link.type;
      lines.push(
        `- **Statement #${claimIdx}** ↔ **${source.title}**: \`${typeLabel}\` (Relevance: ${link.excerptRelevance}, Scope: ${link.scopeMismatch})`
      );
    });
    lines.push("");
  }

  // 8. Source-source relationships
  lines.push(`## 8. Source-to-Source Relationships\n`);
  if (report.sourceRelationships.length === 0) {
    lines.push(`_No source-to-source relationships recorded._\n`);
  } else {
    report.sourceRelationships.forEach(({ relationship: r, fromSource, toSource }) => {
      const typeLabel = SOURCE_REL_TYPE_LABELS[r.type]?.label || r.type;
      lines.push(
        `- **${fromSource?.title || r.fromSourceId}** → **${toSource?.title || r.toSourceId}**: \`${typeLabel}\` (${r.verification})`
      );
      if (r.explanation) {
        lines.push(`  - Explanation: ${r.explanation}`);
      }
    });
    lines.push("");
  }

  // 9. Wording changes (with reviewer state)
  lines.push(`## 9. Observable Wording Shifts\n`);
  if (report.wordingChanges.length === 0) {
    lines.push(`_No wording shifts recorded._\n`);
  } else {
    report.wordingChanges.forEach(({ sourceA, sourceB, observations }) => {
      lines.push(`### Comparison: "${sourceA?.title}" vs "${sourceB?.title}"`);
      observations.forEach((obs) => {
        lines.push(
          `- **${obs.kind.replace(/_/g, " ")}** [Review State: ${obs.reviewState}]: ${obs.explanation}`
        );
      });
      lines.push("");
    });
  }

  // 10. Earliest record + independence per claim
  lines.push(`## 10. Earliest Traceable Record & Independence Assessment\n`);
  report.claimsReport.forEach((item, idx) => {
    lines.push(`### Statement #${idx + 1}: "${item.claim.text}"`);
    lines.push(
      `- **Earliest Record:** ${
        item.earliest.type === "earliest_among_dated"
          ? `${item.earliest.source.title} (${item.earliest.source.publishedAt || "undated"}) [${
              item.earliest.isProvisional ? "PROVISIONAL" : "DATED"
            }]`
          : item.earliest.message
      }`
    );
    lines.push(`- **Independence Assessment:** ${item.independence.description}\n`);
  });

  // 11. Open review items (gaps) with next steps
  lines.push(`## 11. Open Review Items & Next Steps\n`);
  if (report.allOpenGaps.length === 0) {
    lines.push(`_All review items are resolved or dismissed._\n`);
  } else {
    report.allOpenGaps.forEach((gap) => {
      lines.push(`- **[${gap.ruleId}]** ${gap.message} → _Next step: ${gap.nextStep}_`);
    });
    lines.push("");
  }

  // 12. Search coverage
  if (report.searchRuns.length > 0) {
    lines.push(`## 12. Search Coverage\n`);
    report.searchRuns.forEach((run, idx) => {
      lines.push(`### Search Run #${idx + 1} (${run.provider.toUpperCase()}${run.mock ? " - MOCK" : ""})`);
      lines.push(`- **Timestamp:** ${run.ranAt}`);
      lines.push(`- **Queries Run / Failed:** ${run.coverage.queriesRun} / ${run.coverage.queriesFailed}`);
      lines.push(`- **Results Dated / Undated:** ${run.coverage.dated} / ${run.coverage.undated}`);
      lines.push(`- **Coverage Note:** ${run.coverage.note}`);
      lines.push("");
    });
  }

  return lines.join("\n");
}


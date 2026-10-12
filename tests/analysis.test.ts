import { describe, it, expect } from "vitest";
import { splitStatements, isMostlyNonLatin } from "../lib/analysis/splitter";
import { detectFeatures } from "../lib/analysis/highlights";
import { suggestQuestions } from "../lib/analysis/questions";

describe("Rule-Based Statement Splitter", () => {
  it("protects abbreviations, initials, times, and decimals from splitting", () => {
    const text = "Dr. Mara Quillon met Mr. A. B. Vance at 3:30 p.m. to discuss the 3.5 percent tax rate. The meeting ended peacefully.";
    const splits = splitStatements(text);
    expect(splits.length).toBe(2);
    expect(splits[0].text).toContain("Dr. Mara Quillon");
    expect(splits[0].text).toContain("3.5 percent");
    expect(splits[1].text).toBe("The meeting ended peacefully.");
  });

  it("never splits inside quotes", () => {
    const text = 'He shouted "Stop the port! Don\'t let anyone enter." The crowd dispersed.';
    const splits = splitStatements(text);
    expect(splits.length).toBe(2);
    expect(splits[0].text).toContain('"Stop the port! Don\'t let anyone enter."');
  });

  it("splits on semicolons and newlines", () => {
    const text = "First statement on harbour permits;\nSecond statement on city council.\nThird statement follows.";
    const splits = splitStatements(text);
    expect(splits.length).toBe(3);
  });

  it("splits compound sentences on conjunctions when both sides have >=4 words and verbs", () => {
    const text = "The police arrested the harbour inspector, but officials denied any link to the mayor.";
    const splits = splitStatements(text);
    expect(splits.length).toBe(2);
    expect(splits[0].text).toContain("The police arrested the harbour inspector");
    expect(splits[1].text).toContain("officials denied any link to the mayor");
  });

  it("does not split enumerations like 'A, B and C'", () => {
    const text = "The investigation inspected records for docks, warehouses and harbour slips yesterday.";
    const splits = splitStatements(text);
    expect(splits.length).toBe(1);
  });

  it("merges short fragments under 3 words into previous statement", () => {
    const text = "The councillor was arrested yesterday.\nQuite suddenly.";
    const splits = splitStatements(text);
    expect(splits.length).toBe(1);
    expect(splits[0].text).toContain("Quite suddenly.");
  });

  it("detects mostly non-Latin scripts", () => {
    expect(isMostlyNonLatin("पोर्ट हाल्वरन में पार्षद मारिया को गिरफ्तार किया गया।")).toBe(true);
    expect(isMostlyNonLatin("Councillor Quillon was arrested in Port Halvren.")).toBe(false);
  });
});

describe("Feature Detection & Highlights", () => {
  it("detects currency symbols, lakh, crore, and percentages", () => {
    const text = "The company lost ₹ 50 lakh and $10 million, totaling a 15% revenue drop.";
    const features = detectFeatures(text);
    const numFeatures = features.filter((f) => f.kind === "number");
    expect(numFeatures.length).toBeGreaterThanOrEqual(3);
  });

  it("tags ambiguous slash dates as F_DATE_AMBIGUOUS without guessing", () => {
    const text = "The notice was filed on 04/05/2099.";
    const features = detectFeatures(text);
    const dateFeature = features.find((f) => f.kind === "date");
    expect(dateFeature).toBeDefined();
    expect(dateFeature?.ruleId).toBe("F_DATE_AMBIGUOUS");
  });

  it("prioritizes quote over nested features", () => {
    const text = 'The witness said "The $500 fine was 100% unfair" in court.';
    const features = detectFeatures(text);
    const quoteFeature = features.find((f) => f.kind === "quote");
    expect(quoteFeature).toBeDefined();
    expect(quoteFeature?.text).toBe('"The $500 fine was 100% unfair"');
  });

  it("detects absolute terms and allegation cues separately", () => {
    const text = "BREAKING: Everyone knows she is an alleged spy. This is confirmed!!";
    const features = detectFeatures(text);
    const absolute = features.filter((f) => f.kind === "absolute");
    const allegation = features.filter((f) => f.kind === "allegation");
    expect(absolute.length).toBeGreaterThanOrEqual(2);
    expect(allegation.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Suggested Questions Generator", () => {
  it("generates targeted inquiry questions for features", () => {
    const text = "Councillor Quillon was arrested on 04/05/2099 for ₹ 50 lakh.";
    const features = detectFeatures(text);
    const questions = suggestQuestions(text, features);
    expect(questions.some((q) => q.text.includes("Where does this figure come from?"))).toBe(true);
    expect(questions.some((q) => q.text.includes("Is this the original publication date"))).toBe(true);
  });
});

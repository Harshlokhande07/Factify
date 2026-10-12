# FACTIFY — 2-Minute Judge Walkthrough Script

This script walks judges and evaluators through Factify's core workflow and key differentiators.

---

### Step 0: Initial Screen & Invariant Framing (0:00 – 0:15)
1. Open the application at `http://localhost:3000`.
2. Notice the top banner:
   > *"Factify helps you organize and trace an evidence review. It does not independently prove or disprove a claim."*
3. **Key Point for Judges:** Factify is an explainable evidence tracing workbench. It never produces automated "fake news" verdicts, truth scores, or credibility percentages.

---

### Step 1: Claim Entry & Deconstruction (0:15 – 0:40)
1. Click **Step 1 (Enter Text)** in the top navigation.
2. Under **"Or try a fictional demo case study"**, select **"Port Halvren: Councillor Arrest & Espionage Rumour (Fictional 2099)"**.
3. Point out that all data is strictly fictional, set in 2099, and privacy-preserved in local browser memory.
4. Click **"Break Down Statements →"** to advance to Step 2.
5. In Step 2, showcase the **Verbatim Immutable Text** with rule-detected highlights (entities, dates, absolute words, allegation cues).
6. Show how the input was deconstructed into two distinct testable statements:
   - **Statement #1:** Councillor Quillon was arrested on a harbour-permit charge...
   - **Statement #2:** Councillor Quillon is a foreign spy...
7. Point out the interactive split slider, merge controls, and suggested critical inquiry questions.
8. Click **"Confirm Breakdown & Open Workspace →"**.

---

### Step 2: The Claim–Evidence Graph & Contamination Separation (0:40 – 1:15)
1. You are now in the **Claim–Evidence Graph** workspace.
2. Select **Statement #1 (Harbour permit charge)**:
   - Show that it is backed by S1 (Police Press Release, marked PRIMARY) and S2 (Gazette Report).
   - Review status is **Evidence found**.
3. Now click **Statement #2 (Foreign spy allegation)**:
   - **Contamination Separation:** Notice that although S1 is in the investigation, it is NOT linked as supporting Statement #2. Police records for permit infractions do not support espionage allegations.
   - Look at the links for Statement #2: S3 (EchoNet Post), S4 (Viral Forward), and S5 (Beacon Blog) are linked as **"Repeats without evidence"**, not supporting sources!
   - Highlight the **Conservative Independence Result**:
     > *"No supporting records: No records linked with 'supports' type."*

---

### Step 3: Provenance Chains & Wording Shifts (1:15 – 1:40)
1. Click on the edge connecting **S3 (EchoNet Post)** and **S2 (Gazette Report)**:
   - Notice the relationship: **"Appears to repeat (Reviewer suspected)"**.
   - Inspect the **Wording Shift Comparison panel**:
     - Notice the detected shift: **Hedge → Assertion**.
     - The Gazette wrote: *"investigators are examining a possible espionage allegation"*.
     - The social post shifted this to: *"Councillor Quillon was confirmed to be a foreign spy"*.
2. Look at the **Earliest Traceable Record card** on Statement #2:
   - S2 is dated 2099-03-03, but S4 (Viral Forward) is undated.
   - Factify honestly labels the earliest record as **Provisional** because S4 could have circulated earlier.

---

### Step 4: Open Evidence Gaps & Report Generation (1:40 – 2:00)
1. Switch to the **Evidence Gaps** tab:
   - Show open review items: **G2 (No primary source for espionage)**, **G3 (Undated record S4)**, and **G6 (Lack of independent corroboration)**.
   - Show how reviewers can dismiss a gap with a documented justification.
2. Click **"Generate Report"** in the top toolbar to open `/report`.
3. Showcase the print-ready, auditable investigation report:
   - Verbatim original text.
   - Scope breakdown (5 sources: 4 dated, 1 undated).
   - Detailed relationship tables and wording shift records.
   - 1-click **Download Markdown**, **Download JSON**, and **Print Report** buttons.
4. Conclude: Factify replaces opaque "black-box truth detectors" with transparent, auditable evidence tracing.

# Objective Imagery Task Design

Internal design note, not shown in the UI. Written to record *why* the two objective imagery tasks are built the way they are, so this reasoning is ready to drop into the dissertation methodology section. Verify all citation details (volume/page numbers, exact wording) against the original sources before submission — these are reproduced from memory and should be checked, not trusted blindly.

## 1. Why add objective tasks at all

The original design measured imagery purely through an 8-item self-report Likert questionnaire (`frontend/src/data/imageryQuestionnaire.ts`), modelled loosely on the VVIQ (Marks, 1973) and PSIQ (Andrade et al., 2014) already cited in the project's Related Work. Pure self-report vividness ratings have a known validity limitation in imagery research: they capture *believed* vividness, not necessarily *functional* imagery ability, and the two do not always correlate cleanly (Pearson, 2019, discusses imagery as "a weaker form of perception" that varies in ways introspection doesn't always track well). Pairing self-report with a behavioural/objective measure is standard practice for addressing this — it lets the dissertation report both what participants *believe* about their imagery and what their imagery *does* in a task with a right/wrong answer.

Two tasks were chosen instead of one so that two of the four self-report dimensions (`spatial_flow`, `visual_vividness`) each get an objective counterpart, while `imagery_control` and `imagery_stability` remain self-report-only in this version (scope decision — objective analogues for those exist in the literature, e.g. imagined-rotation-and-stop tasks for control, but add real design complexity and were judged out of scope for this addition).

**Self-report item count (2026-07-14 revision):** the questionnaire was trimmed from 8 to 6 items to reduce participant fatigue. The two items dropped were the second `visual_vividness` and second `spatial_flow` items specifically (not an arbitrary cut) — those are exactly the two dimensions that gained an objective task in this same round of changes, so each keeps one self-report item as a subjective-vs-objective comparison point rather than two redundant self-report items with no objective check. `imagery_control` and `imagery_stability` keep both of their items since they have no objective counterpart to lean on.

## 2. Task 1 — Mental rotation (maps to `spatial_flow`)

**Paradigm:** Cooper & Shepard's (1973) chronometric mental-rotation task using rotated alphanumeric characters, itself building on Shepard & Metzler's (1971) foundational 3D mental-rotation paradigm. The letter-rotation version was chosen over the 3D block-pair version specifically because it is implementable with a single CSS `rotate()`/`scaleX(-1)` transform on a glyph, rather than requiring 3D stimulus rendering — a legitimate simplification precedent in the literature (the letter/character version is itself a widely used, separately-cited paradigm, not an ad hoc shortcut of the block version).

**Design:** A single asymmetric character (chosen so its mirror image is visibly distinct — e.g. `F`, `G`, `R`, `L`, `J`, `P`) is shown at one of several rotation angles (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°), either in its normal orientation or mirror-flipped. The participant judges "normal" or "mirrored" as fast and accurately as they can. Both accuracy and response time are recorded — RT-by-rotation-angle slope is the classic dependent measure in this literature (larger angular disparity between the presented and canonical orientation predicts longer RT, roughly linearly), so keeping per-trial angle and RT lets the dissertation reproduce that analysis if useful, not just an overall accuracy score.

**Reference:** Cooper, L. A., & Shepard, R. N. (1973). Chronometric studies of the rotation of mental images. In W. G. Chase (Ed.), *Visual Information Processing* (pp. 75–176). Academic Press. See also the foundational: Shepard, R. N., & Metzler, J. (1971). Mental rotation of three-dimensional objects. *Science*, 171(3972), 701–703. A widely used group-testable descendant worth citing alongside these as the standard psychometric instrument in this tradition: Vandenberg, S. G., & Kuse, A. R. (1978). Mental rotations, a group test of three-dimensional spatial visualization. *Perceptual and Motor Skills*, 47(2), 599–604.

## 3. Task 2 — Picture recognition memory (maps to `visual_vividness`)

**Paradigm:** A direct behavioural analogue of Marks (1973) — already cited in this project's Related Work — which found that self-rated visual imagery vividness predicts picture-recall accuracy. Rather than only asking participants to rate their own vividness, this task actually tests recall, so the self-report vividness score can be checked against real recognition performance.

**Design:** A study phase briefly presents a set of simple pictorial stimuli one at a time (this build uses `lucide-react` line-icon glyphs as the pictures — simple, unambiguous, nameable line drawings, which follows the standardisation logic of Snodgrass & Vanderwart's picture-norming methodology rather than using arbitrary/naturalistic photos where object identifiability itself would be a confound). After a filler/delay (the mental rotation task above serves this purpose — see below), a recognition test phase shows a shuffled mix of studied ("old") and new ("foil") pictures; the participant answers "seen before / not seen before" for each. Hits, false alarms and overall recognition accuracy are recorded per item.

**Reference:** Marks, D. F. (1973). Visual imagery differences in the recall of pictures. *British Journal of Psychology*, 64(1), 17–24. Stimulus-design precedent: Snodgrass, J. G., & Vanderwart, M. (1980). A standardized set of 260 pictures: norms for name agreement, image agreement, familiarity, and visual complexity. *Journal of Experimental Psychology: Human Learning and Memory*, 6(2), 174–215.

## 4. Why the mental rotation task sits between study and test

Putting an unrelated task between the picture-memory study phase and its test phase is standard recognition-memory methodology, not an arbitrary ordering choice: without a delay/filler, a test given immediately after study is dominated by short-term/working-memory carryover (recency) rather than the longer-term recognition memory the task is meant to measure. The mental rotation task conveniently serves double duty — it is itself a measure of interest *and* the interpolated distractor task the picture-memory design needs. Session order is therefore:

1. Consent & demographics
2. Self-report imagery questionnaire (existing 8 Likert items)
3. Picture memory — study phase
4. Mental rotation task
5. Picture memory — test phase (recognition)
6. Code-tracing tasks (existing 6 tasks, unchanged)

## 5. Data this produces for analysis

- `imagery_task_trials` (new table, see `backend/app/models.py`): one row per trial of either objective task, with `task_type`, stimulus metadata (angle/mirrored for rotation; icon/is_old for picture memory), response, correctness, and RT.
- This lets the eventual analysis compute, per participant: mental-rotation accuracy and mean RT (optionally RT-by-angle slope), and picture-recognition accuracy (hit rate, false-alarm rate) — each joinable against the self-report dimension scores and the code-tracing performance dataset on `participant_id`, extending the H1/H2 analysis described in `TESTING_METHODOLOGY.md` with an objective-vs-subjective imagery comparison as a secondary analysis.

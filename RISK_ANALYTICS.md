# ICTRAX Risk Analytics Model

## Purpose

ICTRAX risk model version 2.1 converts current inventory, incident, and maintenance records into an explainable 0-100 maintenance-priority score. It supports the capstone paper's stated use of predefined factors, assigned weights, classification thresholds, dashboard analytics, and maintenance reports.

The score predicts relative maintenance priority. It is not a probability that equipment will fail, a safety certification, or a machine-learning forecast.

## Data used

Each score uses the equipment's current status, physical condition, acquisition date, last-maintenance date, and linked incident records. Incident evidence includes priority, category, workflow status, report date, recurrence, and the change between the most recent 90 days and the preceding 90 days.

Rejected incidents are disclosed in the details view but excluded from scoring. Resolved incidents retain reduced, time-decaying influence so historical problems remain visible without permanently dominating the score.

The authenticated server supplies the reference time. This prevents the workstation clock from changing risk age and maintenance calculations.

## Weighted formula

The six factor maxima total exactly 100 points.

| Factor | Maximum | Method |
|---|---:|---|
| Current equipment status | 20 | Operational 0, Under Repair 12, Damaged 20, Missing 20, Condemned 20 |
| Incident history | 25 | Priority, category, workflow state, recency decay, and recurrence; capped at 25 |
| Recent incident trend | 15 | Reports in the latest 90 days compared with days 91-180, plus recent open and repeated reports; capped at 15 |
| Equipment age | 10 | Approximately one point per year, capped at 10 |
| Maintenance staleness | 20 | No points through 30 days; increases to 5 at 90 days, 12 at 180 days, 17 at 365 days, and 20 at two years |
| Physical condition | 10 | New 0, Good 1, Fair 5, Poor 10 |

The factor total is rounded to the nearest whole number and capped at 100.

## Incident weighting

Incident priority starts at Low 1.5, Medium 3, High 5.5, and Critical 8. Missing and damaged categories receive modest multipliers, while Other receives a reduced multiplier. Pending and In Progress reports have more influence than Resolved reports.

Recency multipliers are 1.00 through 90 days, 0.75 through 180 days, 0.45 through one year, 0.20 through two years, and 0.10 afterward. Each repeated category adds a small recurrence bonus before the 25-point cap.

## Minimum scores for decisive evidence

Minimum scores stop severe current evidence from being diluted by otherwise favorable factors.

| Evidence | Minimum score | Resulting band |
|---|---:|---|
| Condemned lifecycle status | 100 | Critical |
| Missing asset status | 85 | Critical |
| Open Critical-priority incident | 75 | Critical |
| Severe age, Poor condition, and maintenance overdue by more than one year | 75 | Critical |
| Damaged asset status | 60 | High |
| Poor condition with maintenance overdue by more than one year | 50 | High |

Condemned assets remain visible because the paper requires risk assessment for listed equipment. Their recommendation is retirement, replacement, or completed archival disposition rather than repair.

## Classification thresholds and actions

| Score | Band | Default action |
|---:|---|---|
| 75-100 | Critical | Inspect within 48 hours and take offline if continued use may be unsafe |
| 50-74 | High | Prioritize during the current week's maintenance round |
| 25-49 | Medium | Include in the next routine inspection |
| 0-24 | Low | Continue normal preventive maintenance |

Missing equipment receives immediate asset-verification guidance. Condemned equipment receives retirement or replacement guidance. These lifecycle-specific actions override the generic maintenance wording.

## Dashboard and export

The Risk Analytics page displays the risk distribution, fleet average, open incidents, overdue maintenance, recurring patterns, location averages, evidence for each score, and a highest-first maintenance-priority ranking. The score-details view shows every factor contribution, any applied minimum, linked incidents, audit history, and recommended action.

The Risk Analytics page can export the maintenance-priority ranking as CSV. The export records the model version and calculation date so the result can be reproduced against the same source records.

## Validation and limitations

Automated regression tests confirm that factor weights total 100, scores remain within 0-100, severe statuses receive their minimum classifications, rejected incidents do not increase risk, and recent trend comparison behaves consistently.

The model's weights and thresholds are predefined decision rules. Before operational adoption, CEU ICT staff should compare rankings with historical maintenance outcomes and approved service intervals, document any calibration, and preserve the model version used for each evaluation. More incident history may support later statistical validation, but the current score should not be described as a probability of failure.

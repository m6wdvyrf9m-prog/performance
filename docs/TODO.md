# Future Integration TODOs

## Insights API User Directory

- Create `InsightsApiUserDirectoryProvider` implementing `UserDirectoryProvider`.
- Map Insights users by stable email address.
- Preserve the current group creation surface: the admin wizard should continue to search and select `DirectoryUser` records.
- Add optional Insights fields once the API contract is known: profile ID, profile date, colour energy scores, customer/organisation metadata, and profile status.
- Do not couple group membership or activity participation directly to an Insights-only model.

## Insights Discovery in MDLE

- Populate `InsightsProfile` from the future Insights adapter.
- Add a dedicated MDLE module for profile summary, profile date, colour energies, and reflection prompts.
- Keep Insights data independent from Colour Cards saved-card history.

## TPI

- Populate `TPIAssessment` as a separate result source.
- Add a Team Performance MDLE module that can show current and historical team results.
- Link a TPI result to a group or team context when that domain model is finalized.

## Leadership 360

- Populate `Leadership360Assessment` as a separate result source.
- Add private participant-level MDLE views for summary, strengths, development themes, and actions.
- Keep visibility rules explicit because 360 data is likely more sensitive than workshop activity records.

## Modular Activity Framework

- Add an activity renderer registry keyed by `ActivityDefinition.type`.
- Keep shared lifecycle rules in the activity service layer: start, live participation, close, finalise, and audit.
- Add per-activity configuration JSON once Version 2 activities need settings.
- Replace polling with SSE or WebSockets if workshops need lower-latency updates.

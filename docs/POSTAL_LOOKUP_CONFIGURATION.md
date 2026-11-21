# Postal code lookup on/off — v1.8.1

Open **Processing settings** and use the **Postal code lookup** toggle. It is **On by default** for a new installation or an upgrade with no saved setting. Changes save immediately in the local application database and remain after reload or restart. Wait for saving to complete before starting another batch.

**On:** a country and supported postal code can propose a probable missing town/city using the local reference. Ambiguous codes stay reviewable and do not silently select a town. The existing confidence, review and Hybrid priority rules apply.

**Off:** the application does not use postal codes to look up or fill a missing town/city. The manual postal lookup button is disabled, and direct requests to the manual lookup API return DISABLED with no town candidates. A missing town remains unresolved until entered manually. A town already supplied in the address can still be read as source information. Postal-code recognition, formatting and validation of supplied address components continue.

The setting applies to new batches, including standard uploads, mapped uploads and demonstration data. Each batch saves its starting value. Running, queued, paused, resumed and completed batches retain that value, so a configuration change does not mix processing behavior within a batch or rewrite saved results. To reprocess an earlier workbook with a different value, change the toggle and upload it again. Manual review lookup always follows the current application toggle, even when reviewing an older batch. Existing inferred towns are not cleared when you switch off; they are saved results from their original processing run.

Full analysis includes **Postal_Lookup_Enabled** for each record, a **Postal lookup enabled** Summary row and processing_settings in Audit. Source + Hybrid output retains its source-column-plus-four-Hybrid-lines layout. The setting is stored separately from source columns and cannot be overridden by a similarly named uploaded column.

IT: GET /api/settings reads the configuration; PATCH /api/settings accepts only a boolean postalLookupEnabled. Automatic town approval was removed in v1.9.1; see RECORD_REVIEW_COMPARISON.md. Mutations use the existing same-origin local-operator protection. No enterprise user roles are introduced. The setting is in metadata; batch_settings is an additive table in the operational database. Keep that database in normal backups. Legacy batches/jobs without a stored setting use the previous On behavior. No new dependency or reference-data download is required.

Regression coverage verifies default On, persisted Off, no reference access in disabled postal-town lookup, absent inferred towns, direct API enforcement, supplied-town preservation, both queue settings across pause/resume, export evidence and browser reload/toggle behavior.

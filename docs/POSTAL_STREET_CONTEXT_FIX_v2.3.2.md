# v2.3.2 — street numbers and postal town inference

This patch fixes the shared Name/address engine used by Live translate, direct workbook uploads and recoverable batch processing. A street such as **12345 SAMUEL LINCOLN DRIVE**, with postal code **01588** and country **US**, now retains the complete street and proposes **WHITINSVILLE** from the actual postal code:

```text
1/JOHNNY APPLESEED
2/12345 SAMUEL LINCOLN DRIVE
2/01588
3/US/WHITINSVILLE
```

WHITINSVILLE is a probable town from the installed postal reference, not proof of address deliverability. Postal-derived proposals still require review.

## Root cause and reproduction

The defect was reproduced before editing the parser, using the installed worldwide reference and the screenshot's exact street/postal combination. The saved postal was correctly **01588**, but Town_Source was **GAZETTEER_MATCH**, with **MANDAN** selected from a gazetteer alias for the word LINCOLN. The existing shared street detector omitted DRIVE and DR. That omission allowed a street-name fragment to pass the residual-locality test and also accepted the leading 12345 as a postal-pattern candidate. The false gazetteer town prevented the missing-town postal lookup from running.

This is distinct from an incorrect 12345 postal reference: in the installed snapshot, US 12345 maps to SCHENECTADY. The screenshot's MANDAN result came from the street-name alias. Both paths needed the same address-context correction.

The fix expands the shared street detector to recognize DRIVE/DR, COURT/CT, CRESCENT/CRES, TERRACE/TER, TRAIL/TRL, PARKWAY/PKWY, PLACE/PL, CIRCLE/CIR, CLOSE and HWY, alongside existing street markers. Existing compound international street endings are handled by the same detector rather than a separate postal-only expression. Locality eligibility, house-number postal exclusion and source sanitizing now agree on these street contexts. No separate live/batch implementation or reference-data rewrite is introduced.

## Behavior and limits

- Building numbers stay in the street, even when they have five digits or happen to equal a genuine separately supplied postal code.
- A town/city word inside a recognized street name does not count as independent locality evidence.
- With postal lookup On, a missing town can be proposed from the supplied postal and country. Leading zeros and the existing US ZIP+4 base lookup are retained.
- With postal lookup Off, the town remains unresolved unless independent locality text is supplied. The street and actual postal remain available.
- With no actual postal, a leading house number on a recognized street line does not create a postal or town.
- Genuine postal-first locality lines remain eligible. Explicit town/postal disagreements retain the explicit town and a review finding.
- Name interpretation, ISO country rules, Hybrid line limits and priority order, authenticated decisions, Group restrictions and export tracking remain in effect.

This is a targeted street-context fix. It does not establish that every unknown global street format can be classified automatically. Ambiguous proposals still need review.

## Existing saved batches

The patch does **not** silently recalculate saved records or rewrite decisions/export history. Live translate uses the correction after restart and the next translation request. New uploads and unprocessed worker rows use the corrected engine.

For an affected saved batch, re-upload its original workbook as a new batch to analyze every row with the correction, or correct an editable record's town through Record Review and save a decision. Passed records remain read-only. Keep the original batch if its audit/export history is needed; Admin batch deletion is a separate explicit operation. If an old processing job is resumed, already committed rows retain their saved results and remaining rows use the corrected parser; use a new upload when the whole batch needs consistent reanalysis.

## Apply the patch without reinstalling

Download **mwtsi-patch-to-v2-3-2.zip** and extract it beside the existing application folder. This direct patch requires installed **v2.3.1** and **Node.js 24 or newer**. Earlier versions first follow the retained patches to v2.3.1. Stop the host app and any separate workers. Open a terminal in the existing application folder containing package.json:

```text
node -p "require('./package.json').version"
node "../mwtsi-patch-to-v2-3-2/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v2-3-2/apply-patch.mjs" --app "."
```

The same commands work on macOS, Windows and Linux. If the extracted patch is elsewhere, replace the first quoted path with its actual location. Wait for **Patch operation complete**, then start normally with npm start (or npm run dev if that is your usual mode). Refresh connected browsers. Patch the shared host once.

The installer verifies the signature, backs up the installation/database and builds in place. Existing data, credentials, Groups, reference data and review/export history stay in place. No dependency, operational-schema or startup-script changes are included. Local allowScripts configuration is preserved; other local source conflicts must be compared and merged, never bypassed. See [patch recovery](PATCHING.md).

## Verify on your installation

1. In Live translate, enter Johnny Appleseed, the street above, a separate 01588 line and country US. With lookup On, confirm the street starts with 12345, postal is 01588 and town is WHITINSVILLE when supported by your installed reference.
2. Turn lookup Off and make another translation request. Confirm no postal-derived town is proposed. Restore your desired setting afterward.
3. Upload the same input as a new batch. Confirm Record Review and both workbook export formats contain the corrected town and preserve the original source values.
4. Remove the postal line from a new live input. Confirm 12345 stays in the street and is not promoted to postal/town.

Automated evidence and platform limits are in [verification](VERIFICATION.md).

# Live ISO 20022 postal address XML — v3.4.0

## Three representations in Live Translate

Enter a Name, free-form Address and optional Country as before. The existing 1/2/3 slash preview and Name/Address/Hybrid copy fields remain. A new **Postal address XML** section provides separate **Structured PstlAdr** and **Hybrid PstlAdr** previews and copy buttons for both authenticated roles.

The XML uses interpreted address fields **before** the slash format's Name reservation, four-line capacity and 33/30-character truncation. A long Name can therefore cause postal data to be omitted from the slash output while that available postal code still appears as PstCd in XML. It does not restore data that the shared parser could not identify. Name belongs in the enclosing party's Nm element, outside PstlAdr; the existing transformed Name copy remains a slash-format Name, not an ISO-length party-name export.

**Structured:** separate address elements in PostalAddress24 sequence, without AdrLine. **Hybrid:** PstCd, TwnNm, CtrySubDvsn and Ctry when available, followed by up to two AdrLine elements of up to 70 Unicode code points each. Hybrid address lines come from the pre-slash primary/secondary address, not selected 2/ lines. Street/building/unit data stay in AdrLine in this hybrid representation; granular street/building/unit corrections apply to structured XML.

Both profiles require a real TwnNm and assigned ISO-2 Ctry for this app's format checks. Missing values and placeholders such as NOTPROVIDED/Unresolved do not become valid required elements. HK remains Hong Kong and CN remains China. A Name-only entry does not invent a postal address.

## Review the proposed elements

Open **Review ISO elements** to inspect or correct fourteen optional/required elements and the separate hybrid lines. Street/building proposals recognize simple known street forms with leading numbers, selected number-after-street countries, and explicit unit/floor/department/post-box/building labels. They are conservative heuristics, not a universal address parser. Unknown content is shown as **unmapped source text** for structured output rather than disguised as a Street Name or silently discarded. A manually supplied element equal to an entire unmapped piece removes that piece's unmapped finding; complex reallocation still requires human review.

Corrections are local to the XML drafts. They do not change the slash output, original input, current shared analysis, batch records, decisions or exports. The hybrid line editor is independent of granular structured street/building fields; town, postal/state and country edits are shared by the two XML previews. **Reset ISO corrections** returns both XML drafts to the current interpreted values.

Changing original input or the interpreted address resets corrections. Switching sidebar sections or refreshing an unchanged analysis preserves them in the page session. Reloading/signing out clears the session. XML copies are disabled while translation is stale/loading/failed, and prior responses cannot replace current input. Clipboard permission/HTTP failures fall back to selected text and Ctrl+C/Command+C.

## Limits, findings and interpretation

| Element | Maximum characters |
| --- | ---: |
| Dept, SubDept, StrtNm | 70 |
| BldgNb, PstBx, PstCd | 16 |
| BldgNm | 35 |
| Flr, Room | 70 |
| TwnNm, TwnLctnNm, DstrctNm, CtrySubDvsn | 35 |
| Ctry | 2, assigned ISO 3166-1 alpha-2 |
| AdrLine | 2 occurrences, 70 each in hybrid output |

AdrTp is optional and is not inferred or emitted. Empty elements are omitted. XML text is escaped; unsupported XML 1.0 characters are removed with a finding. Oversized elements use only the permitted prefix and display the excluded tail as a finding. Hybrid text is wrapped to two lines; excess text remains visible in a finding. No overflow is silently presented as complete output.

Potential repetitions of town/country/postal/state in AdrLine are flagged. The formatter never deletes a house number or street name merely because it matches a postal/locality token. Correct the hybrid lines where the same structured information is repeated; retain genuine street/building content where the same text has a different meaning.

**Needs review** means a required value, limit, unmapped piece or potential repetition needs attention. Partial nonempty drafts can still be copied with their findings visible; empty drafts cannot. **Format checks passed** describes the supported local field/length checks, not postal deliverability, correct semantic interpretation, full-message XSD validation, restricted bank character sets or payment-network acceptance. Existing translation confidence/conflict findings remain above the XML and must also be reviewed.

These are namespace-free PstlAdr **fragments** that inherit the enclosing message's namespace, not complete pacs.008/pain.001 messages. Select the receiving bank's exact ISO message version and usage profile before integrating them. The app does not declare a message namespace or certify bank acceptance.

## Example

Input: Willowmere Trading LLC / 125 Cedar Vale Avenue / Suite 8 / Boston MA 02110 / US.

Structured:

```xml
<PstlAdr>
  <StrtNm>CEDAR VALE AVENUE</StrtNm>
  <BldgNb>125</BldgNb>
  <Room>SUITE 8</Room>
  <PstCd>02110</PstCd>
  <TwnNm>BOSTON</TwnNm>
  <CtrySubDvsn>MA</CtrySubDvsn>
  <Ctry>US</Ctry>
</PstlAdr>
```

Hybrid:

```xml
<PstlAdr>
  <PstCd>02110</PstCd>
  <TwnNm>BOSTON</TwnNm>
  <CtrySubDvsn>MA</CtrySubDvsn>
  <Ctry>US</Ctry>
  <AdrLine>125 CEDAR VALE AVENUE</AdrLine>
  <AdrLine>SUITE 8</AdrLine>
</PstlAdr>
```

## Processing, roles and storage

The shared /api/translate analysis, input validation, parser, Name interpretation, ISO country resolution, reference data and postal toggle are unchanged. Off prevents postal-derived town lookup for all three representations; a recognized supplied town can still be shown. The new pure formatter runs on the current one-off analysis in the browser. ISO corrections do not trigger translation requests or database writes. No new API parameters or endpoints are introduced.

Admin/User access remains unchanged. Users may translate their own text and copy XML, while batch upload/export and foreign-Group data remain restricted. Technical Hybrid rule-candidate presentation stays Admin-only. The formatter performs no external lookup and logs no source content.

## Patch from v3.3.0

Download **mwtsi-patch-to-v3-4.zip**. Back up data/configuration, stop the host app and all workers, and extract the bundle beside the existing application folder. In that existing folder containing package.json, use Node.js 24 LTS:

```text
node "../mwtsi-patch-to-v3-4/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v3-4/apply-patch.mjs" --app "."
```

Use the actual extracted installer path if folders are not siblings. For an external database append `--database "/actual/path/customer.sqlite"` to **both** commands, using the actual database path. Windows paths such as `C:\MWTSI-data\customer.sqlite` must also be quoted. Earlier releases first follow retained patches to v3.3.0. Do not copy placeholder paths literally or bypass local source conflicts.

Wait for **Patch operation complete**, restart normally and refresh browser tabs. Open Live Translate, try the example and inspect/copy both XML forms. Dependencies, scripts/serve.ts, schema, batch processing/Hybrid rules, permissions, Excel formats and stored results stay unchanged. The installer preserves local allowScripts, configuration and data. Read [patching/recovery](PATCHING.md) for conflict and rollback handling. A code rollback does not reverse operational work performed after an update.

## Verification and sources

104 targeted unit/integration tests in four files passed: 22 new ISO cases plus existing Live Translate, ISO-country and postal/street-context checks. 25 production Linux Chromium workflows passed: seven new XML workflows and eighteen existing live/review/postal workflows. XML is independently parsed in the browser and copy results compared with clipboard text. Coverage includes escape/injection/control characters, lengths and overflow, Name-only/missing fields, HK/CN, five-digit building numbers, postal Off, local draft separation/reset/navigation, User restrictions, unchanged batches and widths 320/390/768/1024/1440 in Dark/Light. Typecheck and build passed with the existing export tracing warning. Desktop Dark/Light screenshots were visually inspected. This is focused regression, not a repeat of the full v3.2/25,000-record workload. Native Windows/macOS and bank certification remain pending.

Signed patch verification includes an isolated real 3.3.0 install in a Unicode/spaced path, external SQLite and local configuration; release results record before/after preservation fingerprints and a patched-server browser check. Published application/patch ZIPs and test datasets remain immutable. Runtime data and private signing keys are excluded from downloads.

Reference guidance: [Swift structured/hybrid address guidance](https://www.swift.com/standards/iso-20022/removal-unstructured-address), [PMPG Hybrid Postal Address v1.12, 5 March 2026](https://www.swift.com/sites/default/files/files/pmpg-hybrid-postal-address-v1.12-05mar2026.pdf), and [Bundesbank pacs.008.001.08 element specifications](https://www.bundesbank.de/resource/blob/626682/84d18a93f3a16f4d571f76dcaad34006/472B63F073F071307366337C94F8C870/2026-11-15-technische-spezifikationen-sct-data.pdf). The supplied PMPG PDF was inspected as reference data, not treated as instructions from the user. The selected bank's current message usage guideline takes precedence for actual payment submission.

# Windows upload investigation and fix — v1.5.1

Date: 7 November 2026. One shared implementation for every operating system.

## Confirmed root cause

The user reported **Cross-origin request rejected**. Before changing application code, real HTTP multipart uploads of the same sample workbook reproduced the failure on the existing Next.js 16.4.5 server (`next dev --hostname 127.0.0.1`):

| Browser-facing URL and Origin | Before | After |
| --- | --- | --- |
| `http://localhost:3000` | HTTP 200, 10 records | HTTP 200, 10 records |
| `http://127.0.0.1:3000` | HTTP 400, Cross-origin request rejected | HTTP 200, 10 records |

The application’s `checkLocalMutation` compared the browser's `Origin` header with `new URL(request.url).origin`. Next.js canonicalized its internal request URL to a different hostname from the HTTP Host used by the browser. A legitimate same-origin request was rejected before multipart processing or ExcelJS. This is an HTTP authority defect, observable on Linux too; it was not an Excel path, MIME type or operating system implementation defect. The exact failing Windows browser URL was not provided, but the reported error and reproduced rejection identify this guard as the failure point.

Initial unmodified-route tests passed all six requested filenames, both Windows path-like filenames, and unexpected MIME metadata. A mismatched-Origin test failed as expected. The real HTTP authority reproduction above established the specific bug before implementing the fix.

## Smallest functional fix

`src/lib/api.ts` now compares Origin with the validated actual HTTP `Host` and the request protocol, falling back to request URL authority only when Host is absent. It does not equate localhost with 127.0.0.1, allow arbitrary origins, or trust X-Forwarded-Host. Thus a page served at 127.0.0.1 may submit to 127.0.0.1, but an Origin of 127.0.0.1 cannot submit to a Host of localhost. Different ports, schemes, null origins, malformed Host values and foreign domains remain rejected. Origin-less requests retain the previous API behavior. The shared guard also fixes demo/review mutations affected by the same defect.

Reverse proxies must preserve the original HTTP Host and provide the correct request protocol. No general forwarded-header trust or proxy architecture change was introduced. Unrelated deployment configurations may need separate diagnosis.

## Pipeline audit

| Area inspected | Finding / resulting behavior |
| --- | --- |
| File input | Uses `input.files[0]`, never `input.value` as a path. The only `.value` assignment clears the input after an attempt so the same file can be retried. |
| Drag and drop | Uses `event.dataTransfer.files[0]` and the same upload helper as the picker. |
| FormData | Appends the selected File under `file`. Browser supplies the multipart Content-Type and boundary; application does not override them. |
| Upload route | Node runtime; validates origin/size, parses request.formData(), checks File, obtains file.arrayBuffer(), constructs Buffer, imports then saves a batch. |
| Extension | Case-insensitive .xlsx check using display basename. Legacy/macro extensions remain unsupported. |
| MIME | Ignored as an authority for acceptance. Empty, generic binary, ZIP, Excel and unexpected types are tested; valid content is parsed regardless. |
| Filename | Spaces, parentheses, apostrophes, numeric prefixes and Unicode do not determine parsing. Both slash styles in path-like metadata are ignored. Only the final basename, capped at 200 Unicode code points, is stored as SQLite display metadata. It is not a server filename. |
| Original paths | No file.path access and no attempt to open C:\\fakepath or C:\\Users paths. Tests make a path getter throw and verify it is never used. |
| Temporary files | No upload temporary files; no /tmp, /var/tmp or Windows temporary directory assumption. Tests use os.tmpdir() and path.join() for isolated databases. |
| Node fs / path | Runtime fs/path usage is limited to the server-owned SQLite directory/schema under process.cwd() or ADDRESS_DB_PATH. It is unrelated to uploaded filenames. Scripts use fs for explicitly server-side fixtures and exports. |
| ExcelJS | In-memory workbook.xlsx.load(Buffer); ZIP expansion validation precedes parsing. Existing namespace and workbook relationship normalization is preserved. Slashes inside ZIP member names are XLSX package syntax, not client filesystem separators. |
| File validation | 20 MB input, 50,000 rows, 150 MB advertised archive expansion and 10,000 entries; macro/external-link rejection, formula/core-cell restrictions, worksheets and required headers remain enforced. |
| Required columns | Name, Address1, Address2, Address3; existing Raw Test Data / first worksheet selection remains unchanged. Extra fields and Group behavior are preserved. |
| Cleanup / locking | Uploads create no disk files or open filesystem handles needing unlink/close. File/Buffer/Workbook references leave scope after success/failure. No explicit GC is required. An open desktop workbook does not matter once the browser has read its bytes. |
| Errors / logs | Structured failure code, stage, request ID and appropriate HTTP status. Safe development stack frames omit parser messages; production logs omit stack, filename, workbook content and request bodies. |

## Error contract

- FILE_NOT_SELECTED — selection/missing multipart File.
- UNSUPPORTED_EXTENSION — extension validation.
- UPLOAD_TRANSPORT_FAILED — browser fetch, malformed multipart, or uploaded File byte read.
- INVALID_EXCEL_FILE — signature/archive/worksheet/row validation, size limits or rejected workbook features.
- EXCEL_PARSE_FAILED — ZIP/ExcelJS loader failure after preliminary archive validation.
- REQUIRED_COLUMNS_MISSING — parsed worksheet lacks a required column.
- SERVER_PROCESSING_FAILED — origin guard, batch processing/database, or unreadable server response; stage distinguishes these cases.

The UI displays the code and stage, retaining safe explanatory text and the server request ID. Browser fetch cannot reliably distinguish a network failure from an OS lock/read failure; the message explains both and suggests saving a copy, closing Excel if necessary, and selecting it again. Picker cancellation does not establish a lock and is not claimed to do so. Production logs intentionally do not include raw parser exceptions or file contents.

## Automated verification

- Entire unit/integration suite: **152 tests passed**, 13 files, including the supplied 200-row workbook and full 18,000-record Name/address/priority regression. No skipped workbook tests in that run.
- Chromium on Linux: all **19 browser scenarios passed** across the initial run and rerun of two corrected test locators. The initial two failures were ambiguous `role=alert` locators matching Next's route announcer as well as the actual error; narrowing to the dismissible application alert fixed the tests without application changes. Includes all seven existing workflow scenarios, file picker, drag/drop, special/path-like names, unexpected MIME, localhost/127 authority, invalid content and transport failure reporting.
- Windows metadata integration tests include `C:\\fakepath\\input.xlsx`, `C:\\Users\\Manny\\Downloads\\input.xlsx`, and a File with an inaccessible `.path` property. ExcelJS reads the uploaded bytes successfully.
- Security regression tests retain rejection of foreign origins, different ports/schemes, null Origin, malformed Host and spoofed X-Forwarded-Host.
- Production build passed. Production-server smoke tests also passed: localhost and 127.0.0.1 each returned HTTP 200 with the same 10-record upload; a foreign Origin returned HTTP 403.

Commands used (set environment variables using the syntax of your shell):

```text
npm test
npm run build
npm run test:e2e
```

To include external supplied-workbook tests, set REGRESSION_WORKBOOK and NAME_REGRESSION_WORKBOOK to server-side fixture locations. NAME_REGRESSION_OUTPUT optionally selects the comparison output directory. For the Linux managed test runner we set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium; ordinary Playwright installations use their configured browser. No upload code branches on OS.

## Required native browser matrix

Native Windows and macOS machines are not available in this environment. These checks remain **pending**, not verified by Linux Chromium or spoofed user-agent strings:

| Native combination | Status |
| --- | --- |
| Windows 11 + Chrome | Pending native verification |
| Windows 11 + Edge | Pending native verification |
| macOS + Chrome | Pending native verification |
| macOS + Safari | Pending native verification |

For each combination: start the updated app; test both localhost:3000 and 127.0.0.1:3000; choose and drop the same known-valid workbook; repeat with the six requested filenames; confirm identical source rows and Hybrid output; try an invalid .xlsx and confirm the reported stage; retry the same file after failure. Open the valid workbook in desktop Excel and repeat if the browser can read it. If selection/read is blocked by Excel, use a saved copy and verify the clear error/advice. Confirm an invalid extension is rejected and an unrelated Origin remains rejected. Record browser/OS versions and results before claiming native certification.

## Install / operate

Stop the app, back up and retain your data directory, extract the v1.5.1 source into your application folder, then run npm install and npm run dev using Node.js 24 LTS. No workbook reupload is needed to migrate stored batches, and existing review decisions are unchanged. Retry the failed upload on the updated server. Do not disable the origin guard or construct a local path from the browser filename.

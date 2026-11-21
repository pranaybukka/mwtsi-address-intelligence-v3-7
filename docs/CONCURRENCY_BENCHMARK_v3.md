# Concurrency benchmark — v3.0.0

2026-11-11T13:51:06.616Z. Production build, 25,000 fictional records, authenticated Group-scoped reviewers, 15s per level after 3s warmup, 1000ms think time. Each level overlaps a 1,000-row import and a full-analysis export of the original batch.

| Active users | Page p95 ms | Decision p95 ms | HTTP req/s | Unexpected errors | Export / import | Targets |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 5 | 205.4 | 105.7 | 12.5 | 0 | COMPLETED / COMPLETED | PASS |
| 10 | 344.8 | 264.5 | 22.2 | 0 | COMPLETED / COMPLETED | PASS |
| 25 | 893.8 | 870.2 | 34.1 | 0 | COMPLETED / COMPLETED | LIMIT EXCEEDED |
| 50 | 1738.7 | 1295.6 | 47 | 0 | COMPLETED / COMPLETED | LIMIT EXCEEDED |

Targets: page p95 ≤500ms, decision p95 ≤1,000ms, no unexpected errors and completed background jobs. Requests include page reads, dashboard refreshes, claims, decisions, queue submissions and an expected User-role export denial. Job-completion polling/downloads after the timed window are excluded from throughput. See the JSON report for operation counts, HTTP statuses, p50/p95/p99, response sizes, hardware and container limits.

Short synthetic single-host test. Not a sustained production capacity certification. Browser rendering, WAN/TLS/proxy behavior, login bursts and real human think times are not measured.

## Dual-address interpretation

This run used --dual:25,000 source records and50,000 independently analyzed address blocks. Every measured level overlapped a1,000-row dual-address import and full-analysis export of all25,000 original records (roughly67MB per workbook). All levels completed with zero unexpected errors.5 and10 reviewers met both latency targets;25 and50 exceeded the page target, and50 also exceeded the decision target. Treat10 active reviewers during large exports as a conservative initial operating point on the measured2-CPU/8GiB container, not a product limit or capacity guarantee. Size and load-test the actual host before promising higher concurrency.

The production benchmark preceded the final explicit-choice fix for ambiguous Name/BNP_Name headers. Its canonical-header workload, address engine, review, paging and export paths are unchanged by that guard; final mapping behavior is separately regression-tested.

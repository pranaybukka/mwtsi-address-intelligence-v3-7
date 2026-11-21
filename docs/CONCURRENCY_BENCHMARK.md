# Concurrency benchmark — v2.0.0

2026-11-09T03:08:14.736Z. Production build, 18,000 fictional records, authenticated Group-scoped reviewers, 30s per level after 5s warmup, 1000ms think time. Each level overlaps a 1,000-row import and a full-analysis export of the original batch.

| Active users | Page p95 ms | Decision p95 ms | HTTP req/s | Unexpected errors | Export / import | Targets |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| 5 | 22.5 | 24.8 | 15.4 | 0 | COMPLETED / COMPLETED | PASS |
| 10 | 20.8 | 30.5 | 31.2 | 0 | COMPLETED / COMPLETED | PASS |
| 25 | 38.2 | 49.8 | 76.2 | 0 | COMPLETED / COMPLETED | PASS |
| 50 | 112.2 | 144 | 145.1 | 0 | COMPLETED / COMPLETED | PASS |

Targets: page p95 ≤500ms, decision p95 ≤1,000ms, no unexpected errors and completed background jobs. Requests include page reads, dashboard refreshes, claims, decisions, queue submissions and an expected User-role export denial. Job-completion polling/downloads after the timed window are excluded from throughput. See the JSON report for operation counts, HTTP statuses, p50/p95/p99, response sizes, hardware and container limits.

Short synthetic single-host test. Not a sustained production capacity certification. Browser rendering, WAN/TLS/proxy behavior, login bursts and real human think times are not measured.

## Test host and observed improvement

Linux x64, Node.js v24.22.1, Intel Xeon Platinum 8573C, cgroup CPU quota equivalent to two cores and 8 GiB memory limit. The 18,000-record fictional batch was distributed across ten Groups. Reference snapshot: 14a75cba24111e3ce1fb.

An earlier prerelease candidate completed its background jobs without unexpected errors but had page p95 of 1,052.1 / 1,920.7 / 2,862.5 / 3,255.7ms at 5 / 10 / 25 / 50 reviewers. Profiling identified repeated count/option scans. Incremental per-Group totals reduced an isolated uncached page query from about 70ms to 1.7ms; the final end-to-end results above include concurrent imports, exports and decisions. The earlier measurements are retained in CONCURRENCY_BENCHMARK_BEFORE_COUNTS.json for comparison.

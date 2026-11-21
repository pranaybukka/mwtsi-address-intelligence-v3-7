import {it,expect} from 'vitest';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
it.skipIf(!process.env.REGRESSION_WORKBOOK)('supplied workbook has no unexplained discrepancies or invariant failures',()=>{const out=mkdtempSync(path.join(tmpdir(),'atlas-regression-'));execFileSync(process.execPath,['--import','tsx','scripts/regression.ts',process.env.REGRESSION_WORKBOOK!,out],{env:process.env,timeout:120000,stdio:'pipe'});const report=JSON.parse(readFileSync(path.join(out,'regression-report.json'),'utf8'));expect(report.unexpectedFailures).toEqual([]);expect(report.nonUSShare).toBeGreaterThanOrEqual(.4);expect(report.summary.ERROR).toBe(0);},120000);

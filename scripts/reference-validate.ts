import {validateReferenceFile} from '../src/db/reference-management';
try{const file=process.argv[2];if(!file)throw Error('Reference path required');process.stdout.write(JSON.stringify(validateReferenceFile(file)));}catch{console.error('Reference validation failed: format, catalog, relationship or integrity check');process.exitCode=1;}

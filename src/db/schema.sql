PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS countries (code TEXT PRIMARY KEY,alpha3 TEXT NOT NULL,name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS country_aliases (alias TEXT NOT NULL,country TEXT NOT NULL,PRIMARY KEY(alias,country));
CREATE TABLE IF NOT EXISTS subdivisions (country TEXT NOT NULL,code TEXT NOT NULL,name TEXT NOT NULL,PRIMARY KEY(country,code));
CREATE TABLE IF NOT EXISTS subdivision_aliases (alias TEXT NOT NULL,country TEXT NOT NULL,code TEXT NOT NULL,PRIMARY KEY(alias,country,code));
CREATE TABLE IF NOT EXISTS places (id TEXT PRIMARY KEY,country TEXT NOT NULL,name TEXT NOT NULL,normalized_name TEXT NOT NULL,subdivision TEXT NOT NULL DEFAULT '',source TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS places_name ON places(normalized_name,country);
CREATE INDEX IF NOT EXISTS places_country ON places(country);
CREATE TABLE IF NOT EXISTS place_aliases (alias TEXT NOT NULL,place_id TEXT NOT NULL,PRIMARY KEY(alias,place_id));
CREATE TABLE IF NOT EXISTS postal_codes (country TEXT NOT NULL,postal TEXT NOT NULL,place_id TEXT NOT NULL,subdivision TEXT NOT NULL DEFAULT '',PRIMARY KEY(country,postal,place_id));
CREATE INDEX IF NOT EXISTS postal_lookup ON postal_codes(postal,country);
CREATE TABLE IF NOT EXISTS postal_patterns (country TEXT PRIMARY KEY,pattern TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS address_tokens (country TEXT NOT NULL,token TEXT NOT NULL,kind TEXT NOT NULL,PRIMARY KEY(country,token));
CREATE TABLE IF NOT EXISTS batches (id TEXT PRIMARY KEY,filename TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY,batch_id TEXT NOT NULL,payload TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS records_batch ON records(batch_id);
CREATE TABLE IF NOT EXISTS review_events (id INTEGER PRIMARY KEY AUTOINCREMENT,record_id TEXT NOT NULL,event TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS upload_drafts(id TEXT PRIMARY KEY,filename TEXT NOT NULL,bytes BLOB NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS batch_metadata(batch_id TEXT PRIMARY KEY,payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,filename TEXT NOT NULL,status TEXT NOT NULL,total INTEGER NOT NULL,cursor INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,error TEXT,lease_owner TEXT,lease_until INTEGER,reference_id TEXT NOT NULL,request_key TEXT UNIQUE);
CREATE INDEX IF NOT EXISTS jobs_status ON jobs(status,lease_until);
CREATE TABLE IF NOT EXISTS job_rows(job_id TEXT NOT NULL,position INTEGER NOT NULL,source TEXT NOT NULL,PRIMARY KEY(job_id,position));
CREATE TABLE IF NOT EXISTS reference_versions(id TEXT PRIMARY KEY,snapshot_id TEXT NOT NULL,file_path TEXT NOT NULL,manifest TEXT NOT NULL,validated INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reference_tasks(id TEXT PRIMARY KEY,action TEXT NOT NULL,status TEXT NOT NULL,version_id TEXT,actor TEXT NOT NULL,reason TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,message TEXT NOT NULL DEFAULT '',lease_owner TEXT,lease_until INTEGER);
CREATE TABLE IF NOT EXISTS reference_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,at TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,version_id TEXT,reason TEXT NOT NULL,detail TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS batch_settings(batch_id TEXT PRIMARY KEY,payload TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS auth_users(id TEXT PRIMARY KEY,username TEXT NOT NULL COLLATE NOCASE UNIQUE,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('Admin','User')),group_name TEXT,must_change INTEGER NOT NULL DEFAULT 1,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS user_appearance(user_id TEXT PRIMARY KEY,scheme TEXT NOT NULL CHECK(scheme IN ('aurora','ocean','amethyst','ember','rose','graphite')),mode TEXT NOT NULL CHECK(mode IN ('dark','light')));
CREATE TRIGGER IF NOT EXISTS delete_user_appearance AFTER DELETE ON auth_users BEGIN DELETE FROM user_appearance WHERE user_id=OLD.id; END;
CREATE TABLE IF NOT EXISTS auth_sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS auth_sessions_user ON auth_sessions(user_id);
CREATE TABLE IF NOT EXISTS auth_login_attempts(username TEXT PRIMARY KEY,failures INTEGER NOT NULL,window_start INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS auth_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,at TEXT NOT NULL,actor_id TEXT,actor_username TEXT,action TEXT NOT NULL,target_id TEXT,detail TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS records_group ON records(batch_id,json_extract(payload,'$.source.Group'));

CREATE TABLE IF NOT EXISTS auth_groups(name TEXT PRIMARY KEY,created_at TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS record_index(record_id TEXT PRIMARY KEY,batch_id TEXT NOT NULL,source_order INTEGER NOT NULL,info TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS record_index_batch ON record_index(batch_id,source_order);
CREATE INDEX IF NOT EXISTS record_index_group ON record_index(batch_id,json_extract(info,'$.group'),source_order);
CREATE INDEX IF NOT EXISTS record_index_group_key ON record_index(batch_id,json_extract(info,'$.groupKey'),source_order);
CREATE TABLE IF NOT EXISTS record_index_dirty(record_id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS batch_revision(batch_id TEXT PRIMARY KEY,revision INTEGER NOT NULL DEFAULT 0);
CREATE TRIGGER IF NOT EXISTS records_index_insert AFTER INSERT ON records BEGIN
 INSERT OR IGNORE INTO record_index_dirty VALUES(NEW.id);
 INSERT INTO batch_revision VALUES(NEW.batch_id,1) ON CONFLICT(batch_id) DO UPDATE SET revision=revision+1;
END;
CREATE TRIGGER IF NOT EXISTS records_index_update AFTER UPDATE OF payload ON records BEGIN
 INSERT OR IGNORE INTO record_index_dirty VALUES(NEW.id);
 INSERT INTO batch_revision VALUES(NEW.batch_id,1) ON CONFLICT(batch_id) DO UPDATE SET revision=revision+1;
END;
CREATE TRIGGER IF NOT EXISTS records_index_delete AFTER DELETE ON records BEGIN
 DELETE FROM record_index WHERE record_id=OLD.id; DELETE FROM record_index_dirty WHERE record_id=OLD.id;
 DELETE FROM record_reservations WHERE record_id=OLD.id;
 INSERT INTO batch_revision VALUES(OLD.batch_id,1) ON CONFLICT(batch_id) DO UPDATE SET revision=revision+1;
END;
CREATE TABLE IF NOT EXISTS record_reservations(record_id TEXT PRIMARY KEY,user_id TEXT NOT NULL,username TEXT NOT NULL,token_hash TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS export_jobs(id TEXT PRIMARY KEY,batch_id TEXT NOT NULL,filename TEXT NOT NULL,requested_by TEXT NOT NULL,requested_username TEXT NOT NULL,options TEXT NOT NULL,status TEXT NOT NULL,total INTEGER NOT NULL DEFAULT 0,progress INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,file_path TEXT,error TEXT,lease_owner TEXT,lease_until INTEGER,request_key TEXT UNIQUE);
CREATE INDEX IF NOT EXISTS export_jobs_queue ON export_jobs(status,created_at);

CREATE TABLE IF NOT EXISTS record_group_totals(batch_id TEXT NOT NULL,group_name TEXT NOT NULL,group_key TEXT NOT NULL,first_order INTEGER NOT NULL,info TEXT NOT NULL,PRIMARY KEY(batch_id,group_name));
CREATE INDEX IF NOT EXISTS record_group_totals_scope ON record_group_totals(group_name,batch_id);
CREATE TABLE IF NOT EXISTS record_totals_dirty(batch_id TEXT NOT NULL,group_name TEXT NOT NULL,PRIMARY KEY(batch_id,group_name));
CREATE TRIGGER IF NOT EXISTS index_totals_insert AFTER INSERT ON record_index BEGIN
 INSERT OR IGNORE INTO record_totals_dirty VALUES(NEW.batch_id,json_extract(NEW.info,'$.group'));
END;
CREATE TRIGGER IF NOT EXISTS index_totals_update AFTER UPDATE ON record_index BEGIN
 INSERT OR IGNORE INTO record_totals_dirty VALUES(OLD.batch_id,json_extract(OLD.info,'$.group'));
 INSERT OR IGNORE INTO record_totals_dirty VALUES(NEW.batch_id,json_extract(NEW.info,'$.group'));
END;
CREATE TRIGGER IF NOT EXISTS index_totals_delete AFTER DELETE ON record_index BEGIN
 INSERT OR IGNORE INTO record_totals_dirty VALUES(OLD.batch_id,json_extract(OLD.info,'$.group'));
END;

CREATE TABLE IF NOT EXISTS export_runs(id TEXT PRIMARY KEY,batch_id TEXT NOT NULL,job_id TEXT,mode TEXT NOT NULL,actor_id TEXT NOT NULL,actor_username TEXT NOT NULL,completed_at INTEGER NOT NULL,record_count INTEGER NOT NULL,origin TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS export_runs_batch ON export_runs(batch_id,completed_at);
CREATE TABLE IF NOT EXISTS export_run_records(run_id TEXT NOT NULL,record_id TEXT NOT NULL,batch_id TEXT NOT NULL,record_version INTEGER NOT NULL,PRIMARY KEY(run_id,record_id));
CREATE INDEX IF NOT EXISTS export_records_batch_record ON export_run_records(batch_id,record_id);
CREATE INDEX IF NOT EXISTS export_records_record ON export_run_records(record_id);
CREATE TABLE IF NOT EXISTS export_tracking_legacy_batches(batch_id TEXT PRIMARY KEY);
CREATE TRIGGER IF NOT EXISTS record_export_delete AFTER DELETE ON records BEGIN
 DELETE FROM export_run_records WHERE record_id=OLD.id;
END;

CREATE TABLE IF NOT EXISTS workflow_sessions(id TEXT PRIMARY KEY,kind TEXT NOT NULL,owner_id TEXT NOT NULL,owner_role TEXT NOT NULL,owner_group TEXT,target_batch TEXT NOT NULL,baseline_batch TEXT,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS workflow_items(session_id TEXT NOT NULL,position INTEGER NOT NULL,record_id TEXT,data TEXT NOT NULL,PRIMARY KEY(session_id,position));
CREATE INDEX IF NOT EXISTS workflow_target ON workflow_sessions(target_batch,baseline_batch);
CREATE INDEX IF NOT EXISTS workflow_expiry ON workflow_sessions(state,expires_at);
CREATE TRIGGER IF NOT EXISTS workflow_batch_delete AFTER DELETE ON batches BEGIN
 DELETE FROM workflow_items WHERE session_id IN (SELECT id FROM workflow_sessions WHERE target_batch=OLD.id OR baseline_batch=OLD.id);
 DELETE FROM workflow_sessions WHERE target_batch=OLD.id OR baseline_batch=OLD.id;
END;
CREATE TRIGGER IF NOT EXISTS reference_revision_countries_insert AFTER INSERT ON countries BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_countries_update AFTER UPDATE ON countries BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_countries_delete AFTER DELETE ON countries BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_country_aliases_insert AFTER INSERT ON country_aliases BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_country_aliases_update AFTER UPDATE ON country_aliases BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_country_aliases_delete AFTER DELETE ON country_aliases BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_subdivisions_insert AFTER INSERT ON subdivisions BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_subdivisions_update AFTER UPDATE ON subdivisions BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_subdivisions_delete AFTER DELETE ON subdivisions BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_subdivision_aliases_insert AFTER INSERT ON subdivision_aliases BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_subdivision_aliases_update AFTER UPDATE ON subdivision_aliases BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_subdivision_aliases_delete AFTER DELETE ON subdivision_aliases BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_places_insert AFTER INSERT ON places BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_places_update AFTER UPDATE ON places BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_places_delete AFTER DELETE ON places BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_place_aliases_insert AFTER INSERT ON place_aliases BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_place_aliases_update AFTER UPDATE ON place_aliases BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_place_aliases_delete AFTER DELETE ON place_aliases BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_postal_codes_insert AFTER INSERT ON postal_codes BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_postal_codes_update AFTER UPDATE ON postal_codes BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_postal_codes_delete AFTER DELETE ON postal_codes BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_postal_patterns_insert AFTER INSERT ON postal_patterns BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_postal_patterns_update AFTER UPDATE ON postal_patterns BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_postal_patterns_delete AFTER DELETE ON postal_patterns BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_address_tokens_insert AFTER INSERT ON address_tokens BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_address_tokens_update AFTER UPDATE ON address_tokens BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;
CREATE TRIGGER IF NOT EXISTS reference_revision_address_tokens_delete AFTER DELETE ON address_tokens BEGIN INSERT INTO metadata VALUES('reference-data-revision','1') ON CONFLICT(key) DO UPDATE SET value=CAST(value AS INTEGER)+1; END;

-- Additive capability grants: absent rows retain the established User baseline.
CREATE TABLE IF NOT EXISTS auth_user_entitlements(user_id TEXT PRIMARY KEY,capabilities TEXT NOT NULL);
-- Ownership snapshots for delegated uploads/jobs; legacy resources remain Admin-only.
CREATE TABLE IF NOT EXISTS workspace_resource_owners(kind TEXT NOT NULL,resource_id TEXT NOT NULL,owner_id TEXT NOT NULL,group_name TEXT,created_at INTEGER NOT NULL,PRIMARY KEY(kind,resource_id));
CREATE INDEX IF NOT EXISTS workspace_resource_owner ON workspace_resource_owners(owner_id,kind);

"""
Data migration tool: Couchbase Server → Couchbase Lite

Migrates all app data (config, preferences, analyzer reports, AI history)
from an external Couchbase Server cb_tools bucket to the embedded CBL database.

Usage:
    python -m migrate_to_cbl \\
        --cb-url couchbases://cb.example.com \\
        --cb-user Administrator \\
        --cb-pass 'secret' \\
        --cb-bucket cb_tools \\
        [--dry-run] [--resume] [--delete-source]
"""

import argparse
import json
import sys
from typing import Dict, List, Any, Optional, Tuple
from icecream import ic
from couchbase.cluster import Cluster
from couchbase.auth import PasswordAuthenticator
from couchbase.exceptions import CouchbaseException

try:
    from cbl_store import CBLStore, USE_CBL
    from blob_storage import BlobStorage
except ImportError as e:
    ic(f"❌ Import error: {e}")
    sys.exit(1)

# ---- Constants ----
BATCH_SIZE = 500
DEFAULT_CB_BUCKET = "cb_tools"


class MigrationCounter:
    """Track migration statistics."""
    
    def __init__(self):
        self.copied = 0
        self.skipped = 0
        self.blobs_extracted = 0
        self.errors = 0
    
    def to_dict(self) -> Dict[str, int]:
        return {
            "copied": self.copied,
            "skipped": self.skipped,
            "blobs_extracted": self.blobs_extracted,
            "errors": self.errors,
        }


def parse_args():
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(
        description="Migrate Couchbase Server data to Couchbase Lite"
    )
    parser.add_argument("--cb-url", required=True,
                        help="Source Couchbase Server URL (e.g., couchbases://cb.example.com)")
    parser.add_argument("--cb-user", required=True,
                        help="Source cluster username")
    parser.add_argument("--cb-pass", required=True,
                        help="Source cluster password")
    parser.add_argument("--cb-bucket", default=DEFAULT_CB_BUCKET,
                        help=f"Source bucket name (default: {DEFAULT_CB_BUCKET})")
    parser.add_argument("--cbl-dir", default=None,
                        help="Target CBL directory (default: $CBL_DB_DIR)")
    parser.add_argument("--cbl-name", default=None,
                        help="Target CBL database name (default: $CBL_DB_NAME)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print migration plan without writing")
    parser.add_argument("--collections", default="all",
                        help="Comma-separated list of collections to migrate (default: all)")
    parser.add_argument("--resume", action="store_true",
                        help="Skip documents that already exist in CBL")
    parser.add_argument("--delete-source", action="store_true",
                        help="Delete source docs after successful migration (requires verification)")
    
    return parser.parse_args()


def open_cb_server(cb_url: str, cb_user: str, cb_pass: str, 
                   cb_bucket: str) -> Tuple[Cluster, Any]:
    """Connect to source Couchbase Server."""
    try:
        opts = ClusterOptions(PasswordAuthenticator(cb_user, cb_pass))
        cluster = Cluster(cb_url, opts)
        # Verify connection
        cluster.wait_until_ready()
        bucket = cluster.bucket(cb_bucket)
        ic(f"✅ Connected to {cb_url}/{cb_bucket}")
        return cluster, bucket
    except CouchbaseException as e:
        ic(f"❌ Failed to connect: {e}")
        sys.exit(1)


def iter_default_collection(bucket) -> List[Tuple[str, Dict[str, Any]]]:
    """Iterate docs in _default._default scope/collection."""
    result = []
    try:
        coll = bucket.scope("_default").collection("_default")
        results = bucket.cluster.query(
            f"SELECT meta().id, * FROM {bucket.name}._default._default"
        )
        for row in results:
            doc_id = row["id"]
            # Remove meta
            body = {k: v for k, v in row.items() if k != "id"}
            result.append((doc_id, body))
    except Exception as e:
        ic(f"⚠️ Error iterating _default collection: {e}")
    
    return result


def iter_collection(bucket, scope: str, collection: str) -> List[Tuple[str, Dict[str, Any]]]:
    """Iterate docs in a specific scope/collection."""
    result = []
    try:
        # Use N1QL to fetch docs
        query = f"SELECT meta().id, * FROM {bucket.name}.{scope}.{collection}"
        results = bucket.cluster.query(query)
        for row in results:
            doc_id = row["id"]
            body = {k: v for k, v in row.items() if k != "id"}
            result.append((doc_id, body))
    except Exception as e:
        ic(f"⚠️ Error iterating {scope}.{collection}: {e}")
    
    return result


def iter_scopes(bucket, exclude: set = None) -> List[str]:
    """List all scopes in bucket, excluding certain names."""
    exclude = exclude or {"_default"}
    scopes = []
    try:
        results = bucket.cluster.query(
            f"SELECT DISTINCT scope_name FROM system:scopes WHERE bucket_name = '{bucket.name}'"
        )
        for row in results:
            scope_name = row.get("scope_name")
            if scope_name and scope_name not in exclude:
                scopes.append(scope_name)
    except Exception as e:
        ic(f"⚠️ Error listing scopes: {e}")
    
    return scopes


def build_plan(bucket, collections_filter: str) -> Dict[str, Any]:
    """Build a dry-run plan showing what will be migrated."""
    plan = {
        "config": 0,
        "preferences": 0,
        "analyzer": 0,
        "ai_history": 0,
        "blobs_to_extract": 0,
    }
    
    # Count _default collection docs
    default_docs = iter_default_collection(bucket)
    plan["config"] = 1  # user_config
    plan["preferences"] = sum(1 for doc_id, _ in default_docs if doc_id.startswith("pref_"))
    plan["ai_reference"] = sum(1 for doc_id, _ in default_docs if doc_id in ("payload_reference", "ai_models_list"))
    
    # Count analyzer docs
    analyzer_docs = iter_collection(bucket, "query", "analyzer")
    plan["analyzer"] = len(analyzer_docs)
    plan["blobs_to_extract"] += len(analyzer_docs)
    
    # Count ai_history docs
    scopes = iter_scopes(bucket, exclude={"_default", "query"})
    ai_history_count = 0
    for scope in scopes:
        analysis_docs = iter_collection(bucket, scope, "analysis")
        ai_history_count += len(analysis_docs)
        plan["blobs_to_extract"] += len(analysis_docs) * 2  # prompt + response
    
    plan["ai_history"] = ai_history_count
    
    return plan


def migrate_default_collection(bucket, dst: CBLStore, blobs: BlobStorage, 
                              counters: MigrationCounter, resume: bool) -> None:
    """Migrate config, preferences, payload_reference, models_list."""
    ic("📋 Migrating _default collection...")
    
    docs = iter_default_collection(bucket)
    for doc_id, body in docs:
        try:
            if doc_id == "user_config":
                dst.save_user_config(body)
                counters.copied += 1
            
            elif doc_id == "payload_reference":
                dst.save_payload_reference(body)
                counters.copied += 1
            
            elif doc_id == "ai_models_list":
                dst.save_models_list(body)
                counters.copied += 1
            
            elif doc_id.startswith("pref_"):
                user_id = doc_id[5:]  # Strip "pref_" prefix
                dst.save_preferences(user_id, body)
                counters.copied += 1
        
        except Exception as e:
            ic(f"❌ Error migrating {doc_id}: {e}")
            counters.errors += 1


def migrate_analyzer(bucket, dst: CBLStore, blobs: BlobStorage,
                    counters: MigrationCounter, resume: bool) -> None:
    """Migrate analyzer reports from query.analyzer collection."""
    ic("📊 Migrating analyzer reports...")
    
    docs = iter_collection(bucket, "query", "analyzer")
    for doc_id, body in docs:
        try:
            if resume and dst.load_analyzer(doc_id):
                counters.skipped += 1
                continue
            
            # Extract large payload into blob
            big = body.pop("rawPayload", body.copy())
            blob_ref = blobs.put_json(big)
            counters.blobs_extracted += 1
            
            # Save to CBL
            dst.save_analyzer(
                request_id=doc_id,
                name=body.get("name", "Imported"),
                analyzer_data={**body, "blob_ref": blob_ref},
            )
            counters.copied += 1
        
        except Exception as e:
            ic(f"❌ Error migrating analyzer {doc_id}: {e}")
            counters.errors += 1


def migrate_ai_history(bucket, dst: CBLStore, blobs: BlobStorage,
                      counters: MigrationCounter, resume: bool) -> None:
    """Migrate AI analysis records from per-cluster scopes."""
    ic("🤖 Migrating AI history...")
    
    scopes = iter_scopes(bucket, exclude={"_default", "query"})
    
    for scope_name in scopes:
        ic(f"  → Cluster: {scope_name}")
        docs = iter_collection(bucket, scope_name, "analysis")
        
        for doc_id, body in docs:
            try:
                if resume and dst.get_ai_history(doc_id):
                    counters.skipped += 1
                    continue
                
                # Extract prompt/response into blobs
                prompt_ref = blobs.put_json(body.get("prompt", {}))
                response_ref = blobs.put_json(body.get("response", {}))
                counters.blobs_extracted += 2
                
                # Save to CBL
                dst.add_ai_history(
                    document_id=doc_id,
                    cluster_name=scope_name,
                    provider=body.get("provider", "unknown"),
                    model=body.get("model", "unknown"),
                    request_id_ref=body.get("request_id_ref", ""),
                    prompt=body.get("prompt", {}),
                    response=body.get("response", {}),
                    tokens_in=body.get("tokens_in", 0),
                    tokens_out=body.get("tokens_out", 0),
                    status=body.get("status", "completed"),
                )
                counters.copied += 1
            
            except Exception as e:
                ic(f"❌ Error migrating ai_history {doc_id}: {e}")
                counters.errors += 1


def verify_migration(bucket, dst: CBLStore, counters: MigrationCounter) -> bool:
    """Verify source and target doc counts match."""
    ic("🔍 Verifying migration...")
    
    # Count source docs
    src_config = iter_default_collection(bucket)
    src_analyzer = iter_collection(bucket, "query", "analyzer")
    src_ai_history_count = 0
    scopes = iter_scopes(bucket, exclude={"_default", "query"})
    for scope in scopes:
        src_ai_history_count += len(iter_collection(bucket, scope, "analysis"))
    
    # Count target docs
    dst_stats = dst.stats()
    dst_config = dst_stats["collections"].get("config", 0)
    dst_analyzer = dst_stats["collections"].get("analyzer", 0)
    dst_ai_history = dst_stats["collections"].get("ai_history", 0)
    
    # Basic sanity checks
    checks = [
        (dst_config > 0, "config collection has docs"),
        (dst_analyzer == len(src_analyzer), f"analyzer: {len(src_analyzer)} source == {dst_analyzer} target"),
        (dst_ai_history == src_ai_history_count, f"ai_history: {src_ai_history_count} source == {dst_ai_history} target"),
    ]
    
    all_pass = True
    for check, msg in checks:
        status = "✅" if check else "❌"
        ic(f"{status} {msg}")
        if not check:
            all_pass = False
    
    return all_pass


def main():
    """Main entry point."""
    if not USE_CBL:
        ic("❌ CBL bindings not available. Cannot migrate.")
        sys.exit(1)
    
    args = parse_args()
    
    # Connect to source
    cluster, bucket = open_cb_server(args.cb_url, args.cb_user, args.cb_pass, args.cb_bucket)
    
    # Open target
    try:
        dst = CBLStore()
        blobs = BlobStorage(dst)
    except Exception as e:
        ic(f"❌ Failed to open CBL store: {e}")
        sys.exit(1)
    
    # Build and print plan
    plan = build_plan(bucket, args.collections)
    ic(f"\n📝 Migration plan:")
    ic(json.dumps(plan, indent=2))
    
    if args.dry_run:
        ic("\n(--dry-run: no changes made)")
        return
    
    # Migrate
    counters = MigrationCounter()
    
    ic("\n🔄 Starting migration...")
    migrate_default_collection(bucket, dst, blobs, counters, args.resume)
    migrate_analyzer(bucket, dst, blobs, counters, args.resume)
    migrate_ai_history(bucket, dst, blobs, counters, args.resume)
    
    # Verify
    ic("\n")
    verify_ok = verify_migration(bucket, dst, counters)
    
    # Report
    ic(f"\n📊 Migration complete:")
    ic(json.dumps(counters.to_dict(), indent=2))
    
    if not verify_ok:
        ic("\n⚠️ Verification failed. Run with STORAGE_BACKEND=server to rollback.")
        sys.exit(1)
    
    # Optional cleanup
    if args.delete_source:
        ic("\n🗑️  --delete-source not yet implemented. Please manually delete source docs.")
    
    ic("\n✅ Migration successful!")


if __name__ == "__main__":
    main()

"""DuckDB connection tuned for laptops with ~8 GB RAM (spills to disk instead of OOM)."""

from __future__ import annotations

import os

import duckdb

from pipeline.paths import PROCESSED

MEMORY_LIMIT = os.environ.get("BURNCAL_DUCKDB_MEMORY", "1500MB")
THREADS = int(os.environ.get("BURNCAL_DUCKDB_THREADS", "4"))
SPILL_DIR = PROCESSED / ".duckdb_spill"


def connect(read_only_path: str | None = None) -> duckdb.DuckDBPyConnection:
    SPILL_DIR.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(read_only_path or ":memory:", read_only=bool(read_only_path))
    con.execute(f"SET memory_limit = '{MEMORY_LIMIT}'")
    con.execute(f"SET threads = {THREADS}")
    con.execute("SET preserve_insertion_order = false")
    con.execute("SET enable_progress_bar = false")
    con.execute(f"SET temp_directory = '{SPILL_DIR}'")
    return con


# Graph Report - New folder  (2026-10-01)

## Corpus Check
- 3 files · ~63,388 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 8 nodes · 8 edges · 4 communities (0 shown, 2 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `479ba66c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dockBookBtn
- fitSky

## God Nodes (most connected - your core abstractions)
1. `fitSky()` - 2 edges
2. `fitSkyThenRefresh()` - 2 edges
3. `dockBookBtn()` - 2 edges
4. `queueDock()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (4 total, 2 thin omitted)

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Not enough signal to generate questions. This usually means the corpus has no AMBIGUOUS edges, no bridge nodes, no INFERRED relationships, and all communities are tightly cohesive. Add more files or run with --mode deep to extract richer edges._
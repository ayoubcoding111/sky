# Graph Report - New folder  (2026-10-01)

## Corpus Check
- 3 files · ~756,277 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 26 nodes · 26 edges · 3 communities
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8a74343`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Above the Clouds — Jesko Jets Private Aviation Landing Page
- app.js
- Features

## God Nodes (most connected - your core abstractions)
1. `Above the Clouds — Jesko Jets Private Aviation Landing Page` - 15 edges
2. `Features` - 4 edges
3. `fitSky()` - 2 edges
4. `fitSkyThenRefresh()` - 2 edges
5. `dockBookBtn()` - 2 edges
6. `queueDock()` - 2 edges
7. `Demo` - 1 edges
8. `Screenshots` - 1 edges
9. `What This Is` - 1 edges
10. `Cinematic scroll experience` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (3 total, 0 thin omitted)

### Community 0 - "Above the Clouds — Jesko Jets Private Aviation Landing Page"
Cohesion: 0.13
Nodes (14): Above the Clouds — Jesko Jets Private Aviation Landing Page, Author, Customization, Demo, How the Scroll Choreography Works, License & Credits, Performance & Accessibility, Project Structure (+6 more)

### Community 1 - "app.js"
Cohesion: 0.38
Nodes (4): dockBookBtn(), fitSky(), fitSkyThenRefresh(), queueDock()

### Community 2 - "Features"
Cohesion: 0.50
Nodes (4): Cinematic scroll experience, Content sections (all on one sky photo), Features, Motion details

## Knowledge Gaps
- **16 isolated node(s):** `Demo`, `Screenshots`, `What This Is`, `Cinematic scroll experience`, `Content sections (all on one sky photo)` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 19 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Above the Clouds — Jesko Jets Private Aviation Landing Page` connect `Above the Clouds — Jesko Jets Private Aviation Landing Page` to `Features`?**
  _High betweenness centrality (0.490) - this node is a cross-community bridge._
- **Why does `Features` connect `Features` to `Above the Clouds — Jesko Jets Private Aviation Landing Page`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **What connects `Demo`, `Screenshots`, `What This Is` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Above the Clouds — Jesko Jets Private Aviation Landing Page` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
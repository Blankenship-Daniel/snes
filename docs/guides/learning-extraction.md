# Automatic Learning Extraction

Your Claude Code sessions now automatically extract and store learnings in the Neo4j knowledge graph!

## Overview

When you end a Claude Code session, the **Stop hook** automatically:
1. ✅ Analyzes the conversation
2. ✅ Extracts key learnings using Codex CLI
3. ✅ Stores learnings in Neo4j as Knowledge nodes
4. ✅ Links learnings to relevant entities (Components, Mods, Registers)
5. ✅ Makes learnings available for future RAG retrieval

## What Gets Extracted

### Types of Learnings

**1. Implementations** (`type: implementation`)
- Code that was written
- Files that were modified
- New features added
- Components created

**2. Technical Decisions** (`type: decision`)
- Architecture choices made
- Approaches selected
- Trade-offs considered
- Why certain solutions were chosen

**3. Domain Knowledge** (`type: knowledge`)
- SNES hardware insights
- Register usage patterns
- Memory mapping details
- Best practices learned

**4. Best Practices** (`type: best_practice`)
- Patterns that worked well
- Pitfalls avoided
- Lessons learned
- Optimization techniques

### Learning Structure

Each learning contains:
```json
{
  "topic": "Brief 5-10 word title",
  "content": "1-2 sentence description of what was learned",
  "type": "implementation|decision|knowledge|best_practice",
  "entities": ["player", "$2100", "infinite-magic"],
  "tags": ["magic", "zelda3", "implementation"],
  "session_id": "20250118_143022",
  "created": "2025-01-18T14:30:45Z",
  "source": "session_extraction"
}
```

## How It Works

### Extraction Process

```
Session Ends (Stop Hook)
    ↓
Export Session Transcript
    ↓
Learning Extractor Module
    ├─ Codex CLI Analysis
    │  └─ Intelligent extraction from conversation
    │
    └─ Git Diff Analysis
       └─ File changes and modifications
    ↓
Parsed & Structured Learnings
    ↓
Neo4j Storage
    ├─ Create Knowledge nodes
    └─ Link to related entities
    ↓
Available for RAG Retrieval!
```

### Codex-Based Extraction

The system uses Codex CLI to analyze the session and extract:

**Prompt sent to Codex:**
```
Analyze this Claude Code session and extract key learnings.

For each learning, identify:
1. Topic: A concise 5-10 word title
2. Content: 1-2 sentences describing what was learned
3. Type: implementation, decision, knowledge, or best_practice
4. Entities: SNES components, registers, mods, projects mentioned
5. Tags: Relevant keywords

Focus on:
- Code implementations (what was built)
- Technical decisions (why certain approaches chosen)
- SNES domain knowledge (hardware insights)
- Best practices discovered
- Pitfalls avoided
```

### Git-Based Extraction

Analyzes file changes to extract:
- Modified components
- Updated tools
- Documentation changes

## Example Learnings

### Example 1: Implementation

**Session Activity:**
- Built RAG pipeline integration
- Modified user_prompt_submit.py hook
- Created neo4j_rag.py module

**Extracted Learning:**
```
Topic: RAG Pipeline Integration with Neo4j
Content: Integrated Neo4j knowledge graph with Claude Code hooks to
         automatically inject relevant context from graph queries based
         on user prompts. Used keyword extraction and semantic matching.
Type: implementation
Entities: ["user_prompt_submit", "neo4j_rag", "neo4j"]
Tags: ["rag", "neo4j", "integration", "hooks"]
```

### Example 2: Decision

**Session Activity:**
- Discussed different approaches to context retrieval
- Chose graph-based over vector-based search

**Extracted Learning:**
```
Topic: Graph-based Context Retrieval Choice
Content: Selected Neo4j graph queries over vector embeddings for RAG
         because explicit relationships provide more reliable context
         for SNES domain-specific questions.
Type: decision
Entities: ["neo4j", "rag"]
Tags: ["architecture", "decision", "rag", "retrieval"]
```

### Example 3: Domain Knowledge

**Session Activity:**
- Discussed PPU register usage
- Explained sprite rendering pipeline

**Extracted Learning:**
```
Topic: PPU Sprite Register Usage Pattern
Content: Sprites on SNES require setting up OAM via $2102/$2103 registers,
         then configuring sprite size with $2101 OBJSEL register during
         V-blank for proper rendering.
Type: knowledge
Entities: ["$2102", "$2103", "$2101", "ppu", "sprite_system"]
Tags: ["ppu", "sprites", "registers", "hardware"]
```

### Example 4: Best Practice

**Session Activity:**
- Discovered graceful degradation pattern
- Implemented fallback when Neo4j unavailable

**Extracted Learning:**
```
Topic: Graceful Degradation for Neo4j Integration
Content: Always check Neo4j availability and silently degrade when
         unavailable rather than breaking the hook. This ensures
         Claude Code continues working even if graph is down.
Type: best_practice
Entities: ["neo4j"]
Tags: ["best-practice", "reliability", "hooks"]
```

## Retrieval via RAG

Learnings become part of your knowledge graph and are automatically retrieved:

**Your question:**
```
How do I implement a RAG pipeline?
```

**RAG retrieves your learning:**
```
🧠 Neo4j Knowledge Graph Context:

📚 Domain Knowledge:
  - RAG Pipeline Integration with Neo4j: Integrated Neo4j knowledge
    graph with Claude Code hooks to automatically inject relevant
    context from graph queries...

  - Graceful Degradation for Neo4j Integration: Always check Neo4j
    availability and silently degrade when unavailable...
```

## Querying Stored Learnings

### Neo4j Browser

```cypher
// Get all learnings from last session
MATCH (k:Knowledge)
WHERE k.source = 'session_extraction'
  AND k.created > datetime() - duration({hours: 24})
RETURN k.topic, k.content, k.type, k.tags
ORDER BY k.created DESC

// Find implementation learnings
MATCH (k:Knowledge {type: 'implementation'})
RETURN k.topic, k.content
ORDER BY k.created DESC
LIMIT 10

// Learnings about specific entity
MATCH (k:Knowledge)-[:DOCUMENTS]->(e)
WHERE e.name = 'player'
RETURN k.topic, k.content, k.type
```

### Python API

```python
from tools.neo4j_query_examples import SNESGraphQuery

query = SNESGraphQuery('bolt://localhost:7687', 'neo4j', 'snes-graph-2024')

# Get recent learnings
recent = query.execute_query("""
    MATCH (k:Knowledge)
    WHERE k.source = 'session_extraction'
      AND k.created > datetime() - duration({days: 7})
    RETURN k.topic as topic, k.content as content,
           k.type as type, k.tags as tags
    ORDER BY k.created DESC
""")

for learning in recent:
    print(f"{learning['topic']} ({learning['type']})")
    print(f"  {learning['content']}")
```

## Configuration

### Enable/Disable

Learning extraction is **automatically enabled** if:
1. ✅ Codex CLI is installed (`which codex`)
2. ✅ Neo4j is running
3. ✅ Environment variables are set

To **disable**:
- Stop Neo4j: `./tools/neo4j-docker.sh stop`
- Or unset `NEO4J_PASSWORD`

The hook gracefully degrades - if Codex or Neo4j unavailable, session still exports normally.

### Customize Extraction

Edit `tools/learning_extractor.py` to customize:

**Adjust extraction prompt:**
```python
def extract_learnings_with_codex(self, context: str = None):
    prompt = """Your custom extraction instructions here..."""
```

**Add custom learning types:**
```python
# In _parse_codex_output
if type_val in ['implementation', 'decision', 'knowledge',
                'best_practice', 'my_custom_type']:
    learning["type"] = type_val
```

**Change entity linking:**
```python
# In LearningStorage.store_learning
# Add more node types to link to
OPTIONAL MATCH (p:Project) WHERE toLower(p.name) CONTAINS toLower($entity)
```

## Testing

### Test Extraction

```bash
# Create a test session file
echo "# Test Session

## Summary
Built RAG pipeline integration.
" > test_session.md

# Run extraction
python3 tools/learning_extractor.py test_session.md
```

### Verify Storage

```bash
# Query Neo4j for recent learnings
python3 -c "
from tools.neo4j_query_examples import SNESGraphQuery
query = SNESGraphQuery('bolt://localhost:7687', 'neo4j', 'snes-graph-2024')
learnings = query.execute_query('''
    MATCH (k:Knowledge)
    WHERE k.source = \"session_extraction\"
    RETURN k.topic, k.created
    ORDER BY k.created DESC
    LIMIT 5
''')
for l in learnings:
    print(l['topic'])
"
```

## Viewing Learnings

### In Next Session

Your learnings automatically appear via RAG:

```
User: How did I implement the RAG pipeline?

🧠 Neo4j Knowledge Graph Context:
📚 Domain Knowledge:
  - RAG Pipeline Integration with Neo4j: Integrated Neo4j knowledge
    graph with Claude Code hooks...
```

### Via Neo4j Browser

Visit http://localhost:7474 and run:

```cypher
// Visualize learning relationships
MATCH (k:Knowledge {source: 'session_extraction'})-[r]->(entity)
RETURN k, r, entity
LIMIT 50
```

### Via Session Logs

Check `.claude/sessions/` for exported sessions with learnings listed.

## Benefits

### Continuous Learning
- Every session adds to your knowledge base
- Learnings accumulate over time
- Build institutional memory

### Improved Context
- RAG retrieves your past learnings
- No need to remember details
- Context-aware responses

### Knowledge Sharing
- Export learnings for team
- Document decisions automatically
- Track implementation history

### Better Recommendations
- Claude sees what worked before
- Suggests similar approaches
- Avoids past mistakes

## Examples in Practice

### After Building RAG Pipeline

**Next session query:**
```
How do I add more keyword detection to RAG?
```

**Retrieved learning:**
```
RAG Pipeline Integration: Used keyword extraction with
configurable lists in neo4j_rag.py. Add keywords to
mod_keywords, hardware_keywords arrays...
```

### After Modding Session

**Next session query:**
```
How do I create a new mod?
```

**Retrieved learning:**
```
Mod Creation Pattern: Created infinite-magic mod by modifying
player.c, changed 7 bytes. Use add_mod() to store in Neo4j...
```

## Troubleshooting

### No learnings extracted?

**Check Codex:**
```bash
which codex
# Should show path to codex
```

**Check session content:**
```bash
cat .claude/sessions/latest_session.md
# Should have conversation content
```

### Learnings not stored?

**Check Neo4j:**
```bash
./tools/neo4j-docker.sh status
# Should show "Neo4j is running"
```

**Check environment:**
```bash
echo $NEO4J_PASSWORD
# Should show password
```

### Want more verbose output?

Check stop hook logs:
```bash
tail -f .claude/sessions/*/logs/*.log | grep "learning"
```

## Advanced Usage

### Manual Extraction

```bash
# Extract from any session file
python3 tools/learning_extractor.py .claude/sessions/20250118_143022_session.md
```

### Batch Process Old Sessions

```python
from pathlib import Path
from tools.learning_extractor import extract_and_store_session_learnings

sessions_dir = Path(".claude/sessions")
for session_file in sessions_dir.glob("*_session.md"):
    print(f"Processing {session_file}...")
    results = extract_and_store_session_learnings(session_file)
    print(f"  Extracted {results['learnings_extracted']} learnings")
```

### Export Learnings

```bash
# Export all session learnings to JSON
python3 -c "
from tools.neo4j_query_examples import SNESGraphQuery
import json

query = SNESGraphQuery('bolt://localhost:7687', 'neo4j', 'snes-graph-2024')
learnings = query.execute_query('''
    MATCH (k:Knowledge)
    WHERE k.source = \"session_extraction\"
    RETURN k.topic, k.content, k.type, k.tags, k.created
''')
print(json.dumps(learnings, indent=2, default=str))
"
```

## Future Enhancements

Planned improvements:
- Semantic deduplication (merge similar learnings)
- Confidence scoring (how certain is the extraction)
- Learning evolution tracking (how learnings change over time)
- Cross-session relationship discovery
- Automatic tagging improvement via embeddings

## Resources

- **Learning Extractor**: `tools/learning_extractor.py`
- **Stop Hook**: `.claude/hooks/stop.py`
- **RAG Integration**: `./rag-integration.md`
- **Neo4j Guide**: `./neo4j-knowledge-graph.md`

---

**Your knowledge graph grows smarter with every session!** 🧠✨

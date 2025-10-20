# Claude Code Hook Integration Guide

## Overview

This guide documents the enhanced Claude Code hook system that integrates RAG (Retrieval-Augmented Generation) pipelines and Codex-powered analysis to provide intelligent context injection and automatic learning extraction.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Claude Code Session                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    User Prompt Submit Hook                       │
│  • Extract keywords from user query                             │
│  • Query Neo4j for relevant context                             │
│  • Inject context into prompt                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Pre-Tool Use Hook                            │
│  • Get file-specific context from Neo4j                         │
│  • Analyze file with Codex CLI                                  │
│  • Retrieve relevant past learnings                             │
│  • Inject enriched context before modification                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Tool Execution  │
                    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Post-Tool Use Hook                           │
│  • Analyze changes with Codex CLI                               │
│  • Extract structured learnings                                 │
│  • Store learnings in Neo4j                                     │
│  • Validate code quality                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Stop Hook                                │
│  • Analyze entire session with Codex                            │
│  • Extract high-level learnings                                 │
│  • Store session summary in Neo4j                               │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. User Prompt Submit Hook
**File**: `.claude/hooks/user_prompt_submit.py`

**Purpose**: Inject relevant context from the knowledge graph into user prompts before Claude processes them.

**How it works**:
1. Extracts keywords from user's question
2. Queries Neo4j for:
   - Relevant mods
   - SNES hardware registers
   - Components and subsystems
   - Past learnings and knowledge
3. Formats and injects context as a preamble to the prompt

**Example**:
```
User: "How does the DMA transfer work?"

Hook injects:
## Relevant Context from Knowledge Graph

### Registers
- MDMAEN ($420B): Master DMA Enable
- HDMAEN ($420C): HDMA Enable

### Knowledge
- DMA transfers can move data during VBlank
...
```

### 2. Pre-Tool Use Hook
**File**: `.claude/hooks/pre_tool_use.py`

**Purpose**: Provide context-aware guidance before file modifications.

**How it works**:
1. Triggers on Write/Edit/MultiEdit operations
2. For each file being modified:
   - **RAG Context**: Queries Neo4j for relevant knowledge about the file
   - **Codex Analysis**: Analyzes the current file structure and patterns
   - **Past Learnings**: Retrieves relevant learnings from previous sessions
3. Outputs enriched context to guide the modification

**Functions**:
- `get_file_context_from_rag()`: Query Neo4j based on file path
- `analyze_file_with_codex()`: Use Codex CLI to analyze file
- `get_relevant_learnings()`: Retrieve past learnings
- `inject_context_for_file_operation()`: Combine and output context

**Example**:
```python
# Before editing sprite.c, hook injects:

## Relevant Context from Knowledge Graph
### Components
- Sprite System: Handles OAM and sprite rendering

## File Analysis
The sprite.c file implements sprite management with:
- OAM buffer management
- Priority handling
- Size/flip attributes

## Relevant Past Learnings
- Sprite rendering: Use DMA for OAM updates during VBlank
```

### 3. Post-Tool Use Hook
**File**: `.claude/hooks/post_tool_use.py`

**Purpose**: Automatically extract and store learnings after file modifications.

**How it works**:
1. Triggers after Write/Edit/MultiEdit operations
2. For each modified file:
   - **Analyze Changes**: Use Codex to understand what was changed
   - **Extract Learning**: Convert analysis into structured learning
   - **Store in Neo4j**: Create Knowledge node with relationships
   - **Validate**: Run code quality checks

**Functions**:
- `analyze_changes_with_codex()`: Analyze what was implemented
- `extract_learning_from_change()`: Structure the learning
- `store_learning_in_neo4j()`: Persist to knowledge graph
- `validate_code_quality()`: Run file-type specific checks

**Learning Structure**:
```python
{
    "topic": "Brief title (100 chars max)",
    "content": "What was learned (500 chars max)",
    "type": "implementation|decision|knowledge|best_practice",
    "source_file": "/path/to/file",
    "timestamp": "ISO 8601 timestamp",
    "tags": ["file_extension", "keywords"]
}
```

**Example**:
```python
# After editing dma.c, hook creates:
{
    "topic": "DMA transfer implementation with timing constraints",
    "content": "Implemented DMA transfer routine that waits for VBlank...",
    "type": "implementation",
    "source_file": "dma.c",
    "tags": ["c", "dma", "timing"]
}
```

### 4. Stop Hook
**File**: `.claude/hooks/stop.py`

**Purpose**: Extract session-level learnings when Claude Code session ends.

**How it works**:
1. Reads entire session transcript
2. Uses Codex to analyze the full conversation
3. Extracts 4 types of learnings:
   - **Implementations**: Code/features created
   - **Decisions**: Architecture/design choices
   - **Knowledge**: Domain knowledge discovered
   - **Best Practices**: Patterns and techniques
4. Stores each learning with entity linking in Neo4j

**See Also**: [Learning Extraction Guide](./learning-extraction.md)

## Configuration

### Prerequisites

1. **Neo4j Database**:
   ```bash
   cd tools
   ./neo4j-docker.sh start
   ```

2. **Python Dependencies**:
   ```bash
   pip3 install neo4j
   ```

3. **Codex CLI**:
   ```bash
   cd snes-modder
   npm install
   ```

### Environment Variables

Set these in your shell or `.env` file:

```bash
# Neo4j Connection
export NEO4J_URI="bolt://localhost:7687"
export NEO4J_USERNAME="neo4j"
export NEO4J_PASSWORD="snesdev2024"

# Session Tracking
export CLAUDE_BUFFER_NAME="your-session-name"
```

## Data Flow

### Context Injection Flow

```
User Query
    │
    ▼
Extract Keywords (user_prompt_submit)
    │
    ▼
Query Neo4j for:
    • Mods matching keywords
    • Registers matching keywords
    • Components matching keywords
    • Knowledge matching keywords
    │
    ▼
Format Context
    │
    ▼
Inject into Prompt
    │
    ▼
Claude receives enriched prompt
```

### Learning Extraction Flow

```
File Modified
    │
    ▼
Codex Analyzes Changes (post_tool_use)
    │
    ▼
Extract Structured Learning
    {
        topic, content, type,
        source_file, tags
    }
    │
    ▼
Store in Neo4j
    CREATE (k:Knowledge)
    MERGE (c:Component)
    CREATE (k)-[:DOCUMENTS]->(c)
    │
    ▼
Available for future RAG queries
```

## Usage Examples

### Example 1: Context-Aware File Editing

**Scenario**: You want to modify the PPU initialization code.

**What happens**:

1. **You type**: "Update the PPU initialization to enable BG2"

2. **user_prompt_submit hook**:
   - Extracts keywords: "PPU", "initialization", "BG2"
   - Queries Neo4j for PPU-related context
   - Injects relevant register information

3. **Claude receives**:
   ```
   ## Relevant Context

   ### Registers
   - INIDISP ($2100): Screen Display
   - TM ($212C): Main Screen Designation

   ### Knowledge
   - PPU initialization must occur during VBlank

   [Original prompt]: Update the PPU initialization to enable BG2
   ```

4. **When Claude edits the file** (pre_tool_use):
   - Analyzes current PPU code with Codex
   - Retrieves past learnings about PPU
   - Shows Claude the current patterns in use

5. **After Claude edits** (post_tool_use):
   - Analyzes what was changed with Codex
   - Extracts learning: "PPU BG2 enablement during init"
   - Stores in Neo4j for future reference

### Example 2: Learning Accumulation

**Session 1**: Implement sprite priority handling
- Hook extracts: "Sprite priority uses OAM attribute 3"
- Stored in Neo4j

**Session 2**: Add sprite collision detection
- Pre-tool hook retrieves: "Sprite priority uses OAM attribute 3"
- Claude sees past learning and maintains consistency

**Session 3**: Optimize sprite rendering
- Pre-tool hook retrieves both previous learnings
- Claude builds on accumulated knowledge

### Example 3: Quality Validation

**Scenario**: You write a new Python tool

**What happens**:

1. Claude writes `tools/new_tool.py`

2. **post_tool_use hook**:
   - Runs `python3 -m py_compile tools/new_tool.py`
   - Validates syntax
   - Logs validation result

3. **If syntax error**:
   - Hook logs error (doesn't block, just records)
   - You can see in logs that validation failed

## RAG Pipeline Details

### Keyword Extraction

The RAG pipeline extracts keywords using a simple but effective method:

```python
def extract_keywords(query: str) -> List[str]:
    # Common SNES terms
    snes_terms = {
        "ppu", "dma", "cpu", "sprite", "bg", "vblank",
        "register", "oam", "palette", "tilemap", ...
    }

    # Extract words matching SNES terms
    words = query.lower().split()
    keywords = [w for w in words if w in snes_terms]

    return keywords
```

### Neo4j Queries

The pipeline uses Cypher to find relevant nodes:

```cypher
// Find mods
MATCH (m:Mod)
WHERE ANY(keyword IN $keywords WHERE
    toLower(m.name) CONTAINS keyword OR
    toLower(m.description) CONTAINS keyword)
RETURN m

// Find registers
MATCH (r:Register)
WHERE ANY(keyword IN $keywords WHERE
    toLower(r.name) CONTAINS keyword OR
    toLower(r.description) CONTAINS keyword)
RETURN r

// Find knowledge
MATCH (k:Knowledge)
WHERE ANY(keyword IN $keywords WHERE
    toLower(k.topic) CONTAINS keyword OR
    toLower(k.content) CONTAINS keyword)
RETURN k
```

### Context Formatting

Retrieved context is formatted as markdown sections:

```markdown
## Relevant Context from Knowledge Graph

### Mods
- **Mod Name**: Description
  Files: file1.c, file2.c

### Registers
- **REGISTER ($addr)**: Description
  Access: read|write|r/w

### Components
- **Component**: Description
  Type: subsystem_type

### Knowledge
- **Topic**: Content
  Type: learning_type
```

## Codex Integration

### Codex CLI Usage

Both hooks use the Codex CLI to analyze code:

```python
# Pre-tool: Analyze before modification
prompt = f"Analyze {file_path} and provide: " \
         "1) Purpose and structure, " \
         "2) Key patterns and conventions, " \
         "3) Important considerations for modifications"

result = subprocess.run(
    [CODEX_CLI, prompt, "--context", file_path],
    capture_output=True,
    text=True,
    timeout=10
)

# Post-tool: Analyze changes
prompt = f"Analyze recent changes to {file_path}. Identify: " \
         "1) What was implemented, " \
         "2) Key decisions made, " \
         "3) Patterns or techniques used, " \
         "4) Important considerations for future work"
```

### Codex Output Processing

Codex output is processed and structured:

```python
# Extract insights from free-form Codex output
analysis = result.stdout.strip()

# Determine learning type based on content
learning_type = "implementation"
if "decision" in analysis.lower():
    learning_type = "decision"
elif "pattern" in analysis.lower():
    learning_type = "best_practice"

# Create structured learning
learning = {
    "topic": extract_topic(analysis),
    "content": analysis[:500],
    "type": learning_type,
    "source_file": file_path
}
```

## Troubleshooting

### Hook Not Running

**Symptoms**: Context not being injected, learnings not stored

**Checks**:
1. Verify hook scripts are executable:
   ```bash
   chmod +x .claude/hooks/*.py
   ```

2. Check hook logs:
   ```bash
   cat .claude/logs/hook-*.log
   ```

3. Test hook manually:
   ```bash
   cd .claude/hooks
   echo '{"tool": "Write", "params": {}}' | ./pre_tool_use.py
   ```

### RAG Not Available

**Symptoms**: Log shows "RAG_AVAILABLE = False"

**Causes**:
1. Neo4j not running
   ```bash
   cd tools
   ./neo4j-docker.sh status
   ```

2. neo4j Python package not installed
   ```bash
   pip3 install neo4j
   ```

3. Import error in neo4j_rag.py
   ```bash
   cd tools
   python3 -c "from neo4j_rag import SNESRAGPipeline"
   ```

### Codex Analysis Failing

**Symptoms**: No Codex insights in pre/post hooks

**Checks**:
1. Verify Codex CLI installed:
   ```bash
   ls -la repos/snes-modder/node_modules/.bin/codex-cli
   ```

2. Test Codex manually:
   ```bash
   cd snes-modder
   npx codex-cli "What is this repo?" --context .
   ```

3. Check timeout (may need to increase from 10s to 30s):
   ```python
   # In hook file
   timeout=30  # Increase if Codex is slow
   ```

### Neo4j Connection Error

**Symptoms**: "Failed to connect to bolt://localhost:7687"

**Solutions**:
1. Start Neo4j:
   ```bash
   cd tools
   ./neo4j-docker.sh start
   ```

2. Wait for initialization (can take 30 seconds):
   ```bash
   ./neo4j-docker.sh wait
   ```

3. Verify credentials:
   ```bash
   echo $NEO4J_PASSWORD  # Should be: snesdev2024
   ```

4. Test connection:
   ```bash
   cd tools
   python3 neo4j_rag.py
   ```

### Learning Not Stored

**Symptoms**: Hook runs but Neo4j has no new Knowledge nodes

**Debug**:
1. Check Neo4j logs:
   ```bash
   docker logs snes-neo4j
   ```

2. Query Knowledge nodes:
   ```cypher
   MATCH (k:Knowledge)
   WHERE k.source = 'post_tool_use_hook'
   RETURN k
   ORDER BY k.created_at DESC
   LIMIT 10
   ```

3. Check hook logs for errors:
   ```bash
   grep "Failed to store learning" .claude/logs/hook-*.log
   ```

## Performance Considerations

### Hook Execution Time

Hooks run synchronously and can slow down operations:

- **user_prompt_submit**: ~100-300ms (Neo4j query)
- **pre_tool_use**: ~500-2000ms (Neo4j + Codex)
- **post_tool_use**: ~500-2000ms (Codex + Neo4j write)

### Optimization Tips

1. **Limit context size**:
   ```python
   # In RAG pipeline
   context = rag.build_context(query, max_items=5)  # Not 50
   ```

2. **Timeout Codex calls**:
   ```python
   # In hooks
   timeout=10  # Don't wait forever
   ```

3. **Graceful degradation**:
   ```python
   # All hooks fail silently if dependencies unavailable
   if not RAG_AVAILABLE:
       return None  # Continue without RAG
   ```

4. **Async processing** (future enhancement):
   ```python
   # Could make post_tool_use async
   # to not block Claude's operation
   ```

## Advanced Usage

### Custom Keyword Extraction

Extend the keyword extractor for your domain:

```python
# In tools/neo4j_rag.py
def extract_keywords(self, query: str) -> List[str]:
    # Add your custom terms
    custom_terms = {"myterm", "myfeature"}

    # Combine with existing
    all_terms = self.snes_terms | custom_terms

    # Extract
    words = query.lower().split()
    keywords = [w for w in words if w in all_terms]

    return keywords
```

### Custom Learning Types

Add new learning types beyond the default 4:

```python
# In .claude/hooks/post_tool_use.py
def extract_learning_from_change(file_path, analysis):
    # Add custom type detection
    if "bug" in analysis.lower():
        learning_type = "bug_fix"
    elif "optimization" in analysis.lower():
        learning_type = "optimization"
    # ... existing types ...
```

Then query by type:

```cypher
MATCH (k:Knowledge)
WHERE k.type = 'bug_fix'
RETURN k
```

### File-Specific Context

Customize context injection per file type:

```python
# In .claude/hooks/pre_tool_use.py
def get_file_specific_context(file_path):
    ext = Path(file_path).suffix

    if ext == ".asm":
        # Query for assembly-specific context
        return get_assembly_conventions()
    elif ext == ".c":
        # Query for C-specific context
        return get_c_patterns()
```

## Best Practices

### 1. Keep Learnings Concise

Learnings are most useful when they're short and specific:

**Good**:
```
Topic: "DMA timing during VBlank"
Content: "DMA transfers should start immediately after entering VBlank (NMI) to ensure completion before rendering starts."
```

**Bad**:
```
Topic: "Everything about DMA"
Content: "DMA is a complex system that... [500 words]"
```

### 2. Tag Consistently

Use consistent tags for better retrieval:

**Good**: `["dma", "timing", "vblank"]`
**Bad**: `["DMA stuff", "timing_issue"]`

### 3. Link Entities

Always link Knowledge to relevant entities:

```cypher
CREATE (k:Knowledge {...})
MERGE (r:Register {name: 'MDMAEN'})
CREATE (k)-[:RELATES_TO]->(r)
```

### 4. Review Periodically

Query and review your learnings:

```cypher
// Learnings by type
MATCH (k:Knowledge)
RETURN k.type, count(*) as count
ORDER BY count DESC

// Recent learnings
MATCH (k:Knowledge)
WHERE k.created_at > datetime() - duration('P7D')
RETURN k.topic, k.type, k.created_at
ORDER BY k.created_at DESC
```

### 5. Maintain Neo4j

Keep your knowledge graph clean:

```cypher
// Find orphaned Knowledge nodes
MATCH (k:Knowledge)
WHERE NOT (k)-[]-()
RETURN k

// Merge duplicate learnings
MATCH (k1:Knowledge), (k2:Knowledge)
WHERE k1.topic = k2.topic
  AND id(k1) < id(k2)
MERGE ...
```

## Integration with Other Systems

### CI/CD Integration

Use hooks to trigger builds/tests:

```python
# In .claude/hooks/post_tool_use.py
def main():
    # ... existing code ...

    if tool_name in ["Write", "Edit"] and file_paths:
        if any(f.endswith(".c") for f in files):
            # Trigger build
            subprocess.run(["make", "build"])
```

### External Knowledge Sources

Enrich Neo4j with external data:

```python
# Periodically import from external sources
def import_from_docs():
    # Parse SNES dev manual
    # Create Knowledge nodes
    # Link to existing entities
```

### Metrics and Analytics

Track hook usage:

```python
# In hooks
log_event("Metrics", {
    "hook": "pre_tool_use",
    "rag_hits": rag_context is not None,
    "codex_hits": codex_analysis is not None,
    "latency_ms": elapsed_time
})
```

Query metrics:

```bash
grep "Metrics" .claude/logs/hook-*.log | \
    jq -s 'group_by(.hook) | map({hook: .[0].hook, count: length})'
```

## Future Enhancements

### Planned Features

1. **Semantic Search**: Replace keyword matching with embeddings
2. **Confidence Scoring**: Rate the quality of retrieved context
3. **Learning Deduplication**: Automatically merge similar learnings
4. **Cross-Session Tracking**: Link related work across sessions
5. **Feedback Loop**: Learn from which contexts were actually useful
6. **Async Processing**: Make post-hook non-blocking

### Experimental Ideas

1. **LLM-Powered Extraction**: Use LLM API to extract better structured learnings
2. **Visual Knowledge Graph**: Web UI to explore the graph
3. **Auto-Documentation**: Generate docs from accumulated learnings
4. **Code Review**: Use learnings to automatically review PRs

## Related Documentation

- [Neo4j Knowledge Graph Guide](./neo4j-knowledge-graph.md)
- [RAG Integration Guide](./rag-integration.md)
- [Learning Extraction Guide](./learning-extraction.md)
- [Neo4j Quick Start](./NEO4J-QUICKSTART.md)
- [RAG Quick Start](./RAG-QUICKSTART.md)

## Support

For issues or questions:

1. Check logs: `.claude/logs/hook-*.log`
2. Review error messages in hook output
3. Test components individually (Neo4j, Codex, RAG pipeline)
4. Consult related documentation above

## Conclusion

The enhanced Claude Code hook system creates a powerful feedback loop:

1. **Context Injection**: Provides relevant knowledge before operations
2. **Intelligent Guidance**: Uses Codex to understand code before modifications
3. **Automatic Learning**: Extracts insights after every change
4. **Knowledge Accumulation**: Builds a graph of domain knowledge over time
5. **Progressive Enhancement**: Each session makes Claude smarter

This system transforms Claude Code from a one-shot assistant into a continuously learning development partner that accumulates and applies domain knowledge across sessions.

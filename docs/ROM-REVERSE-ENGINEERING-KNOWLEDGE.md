# SNES ROM Reverse-Engineering Knowledge - Neo4j Enrichment Complete ✅

## 🎯 Task Completed

Successfully gathered comprehensive SNES ROM reverse-engineering information from multiple authoritative sources and enriched the Neo4j knowledge graph.

## 📊 Knowledge Added to Neo4j

### Knowledge Nodes: 12 Items

1. **SNES ROM Header Location** - Physical location varies by mapping mode
2. **LoROM vs HiROM Memory Mapping** - Two main cartridge memory organization schemes
3. **ROM Header Fields ($FFD5-$FFDE)** - Metadata fields for ROM identification
4. **FastROM Speed Enhancement** - 3.58MHz vs 2.68MHz CPU access
5. **SNES Interrupt Vector Table** - Hardware entry points at $FFE0-$FFFF
6. **Copier Headers (512-byte SMC)** - Additional headers from backup devices
7. **ROM Checksum Validation** - Integrity validation mechanism
8. **WRAM Memory Region** - 128KB Work RAM at banks $7E-$7F
9. **ROM Bank Organization** - 24-bit addressing with 256 banks
10. **MMIO Registers ($2100-$21FF)** - Hardware control registers
11. **Reverse-Engineering ROM Files** - Step-by-step methodology
12. **ExHiROM Extended Mapping** - Extended mapping for >4MB ROMs

### Register Nodes: 10 Items

ROM Header Fields:
- **$FFD5** - ROM Map Mode (LoROM/HiROM/FastROM)
- **$FFD6** - Cartridge Type (hardware features)
- **$FFD7** - ROM Size (2^n KB encoding)
- **$FFD8** - SRAM Size (battery-backed saves)
- **$FFD9** - Destination Code (region)
- **$FFDC** - Complement Check (validation)
- **$FFDE** - ROM Checksum (integrity)

Interrupt Vectors:
- **$FFFC** - RESET Vector (power-on entry point)
- **$FFEA** - NMI Vector (VBlank handler)
- **$FFEE** - IRQ Vector (HBlank/Timer handler)

### Memory Region Nodes: 4 Items

- **LoROM Bank 0 ROM** - $008000-$00FFFF (32KB chunks)
- **HiROM Bank C0 ROM** - $C00000-$FFFFFF (64KB banks)
- **ROM Header Area** - $00FFC0-$00FFDF
- **Interrupt Vectors** - $00FFE0-$00FFFF

### Relationships Created

- **Knowledge ↔ Memory Regions**: ROM knowledge linked to relevant memory areas
- **Knowledge ↔ Header Registers**: Validation/header knowledge linked to ROM header fields
- **Knowledge ↔ Interrupt Vectors**: Interrupt knowledge linked to vector registers

## 🔍 Information Sources

### Primary Sources

1. **SNES MCP Server** (`mcp__snes-mcp-server__memory_map`)
   - ROM memory regions and bank organization
   - LoROM/HiROM mapping details
   - Memory access characteristics

2. **SNESdev Wiki** (via Exa web search)
   - ROM header format specification
   - Interrupt vector table
   - Memory mapping modes
   - **URLs**:
     - https://snes.nesdev.org/wiki/ROM_header
     - https://snes.nesdev.org/wiki/CPU_vectors
     - https://snes.nesdev.org/wiki/Memory_map

3. **SNESLab.net** (via Exa web search)
   - Detailed ROM header field descriptions
   - Region codes and cartridge types
   - **URL**: https://sneslab.net/wiki/SNES_ROM_Header

4. **RetroReversing.com** (via Exa web search)
   - Reverse-engineering methodologies
   - SNES development history
   - ROM mapping explanations
   - **URL**: https://www.retroreversing.com/snes/

5. **Exa Code Context** (`mcp__exa__get_code_context_exa`)
   - ROM parsing implementation details
   - Header verification techniques
   - Mapping mode detection

### Secondary Sources

6. **pvsneslib Wiki** (GitHub)
   - HiROM vs LoROM technical details
   - FastROM implementation
   - **URL**: https://github.com/alekmaul/pvsneslib/wiki/HiRom-and-FastRom

7. **Super Famicom Development Wiki**
   - ROM header writing guide
   - Assembly-level header examples
   - **URL**: https://wiki.superfamicom.org/writing-the-header

## 📚 Key Knowledge Captured

### ROM Structure Fundamentals

**Memory Mapping Modes**:
- **LoROM**: 32KB chunks at $8000-$FFFF in banks $00-$7D (mirrored in $80-$FF)
  - Supports up to 4MB ROM
  - Header at file offset $7FC0
  - Simpler but less contiguous addressing

- **HiROM**: 64KB banks from $C0-$FF
  - More contiguous addressing
  - Header at file offset $FFC0
  - Used for larger games

- **ExHiROM**: Extended mode for >4MB ROMs
  - Uses banks $C0-$FF + $40-$7D
  - Header at file offset $40FFC0
  - Rare but used in late-era titles

**FastROM Enhancement**:
- Enables 3.58MHz CPU access (vs 2.68MHz standard)
- ~30% performance boost
- Activated via Map Mode byte ($FFD5 bit 4)
- Works in banks $80-$FF

### ROM Header Format

**Critical Fields**:
- **$FFC0-$FFD4**: Game Title (21 bytes ASCII)
- **$FFD5**: Map Mode + Speed
- **$FFD6**: Cartridge Type (RAM, SRAM, coprocessors)
- **$FFD7**: ROM Size (encoded as 2^n KB)
- **$FFD8**: SRAM Size (battery backup)
- **$FFD9**: Region Code (Japan, USA, Europe, etc.)
- **$FFDC**: Complement Check (~checksum)
- **$FFDE**: Checksum (16-bit sum of ROM bytes)

**Validation**:
- Checksum XOR Complement must equal $FFFF
- Emulators use this to validate ROM integrity
- Can be recalculated after modifications

### Interrupt Vectors

**Hardware Entry Points** ($FFE0-$FFFF):
- **$FFEA/FFEB**: NMI (VBlank) - ~60 times/sec
- **$FFEE/FFEF**: IRQ (HBlank/Timer) - optional
- **$FFFC/FFFD**: RESET - power-on entry point
- Plus: COP, BRK, ABORT vectors

**Critical for Reverse Engineering**:
- RESET vector points to initialization code
- NMI vector points to main game loop
- Following these vectors reveals code structure

### Reverse-Engineering Methodology

**Step-by-Step Process**:
1. **Identify mapping mode** from ROM header ($FFD5)
2. **Locate interrupt vectors** ($FFE0-$FFFF)
3. **Follow RESET vector** to find initialization code
4. **Disassemble 65816 code** starting from entry points
5. **Map data structures** (sprites, tilemaps, etc.)
6. **Document register access** patterns ($2100-$21FF)

## 🛠️ Tools Created

### `tools/populate_rom_knowledge.py`

Python script that populates Neo4j with comprehensive ROM reverse-engineering knowledge.

**Features**:
- Creates 12 Knowledge nodes with detailed descriptions
- Creates 10 Register nodes for ROM header fields and vectors
- Creates 4 Memory Region nodes for ROM areas
- Links knowledge to related entities
- Tags all entries for easy retrieval
- Includes source URLs for verification

**Usage**:
```bash
python3 tools/populate_rom_knowledge.py
```

**Output**:
- 12 Knowledge entries
- 10 Register entries
- 4 Memory Region entries
- Multiple relationships connecting related concepts

## 🎓 Knowledge Graph Enhancements

The Neo4j graph now contains **comprehensive ROM reverse-engineering knowledge** that can be retrieved via RAG queries.

### RAG Pipeline Enhancements (2025-10-18)

Enhanced the RAG pipeline to properly retrieve ROM reverse-engineering knowledge:

**1. Extended Keyword Extraction** (`neo4j_rag.py:107-114`):
- Added `rom_keywords` list with 16 ROM-specific terms:
  - `header`, `lorom`, `hirom`, `exhirom`
  - `vector`, `vectors`, `reset`, `nmi`, `irq`
  - `interrupt`, `interrupts`, `checksum`, `complement`
  - `mapping`, `fastrom`, `cartridge`, `copier`, `smc`, `validation`
- Now properly extracts ROM-related keywords from user queries

**2. Enhanced Register Category Matching** (`neo4j_rag.py:179-182`):
- Added category filters for ROM-related registers:
  - `"ROM Header"` category for keywords: `rom`, `header`, `checksum`, `validation`, `mapping`
  - `"Interrupt Vectors"` category for keywords: `vector`, `vectors`, `reset`, `interrupt`
- Now retrieves ROM header registers ($FFD5-$FFDE) and interrupt vectors ($FFEA, $FFEE, $FFFC)

**3. Verified Functionality**:
- ✅ Keyword extraction working for ROM queries
- ✅ Register retrieval returning ROM header and interrupt vector registers
- ✅ Knowledge nodes being retrieved for ROM-related queries
- ✅ Relevance scoring and reranking properly prioritizing ROM content

### Example Queries

**"How do I identify ROM mapping mode?"**
→ Returns Knowledge about ROM header $FFD5 field + Register info

**"What is the ROM checksum?"**
→ Returns Knowledge about validation + $FFDE Register details

**"How to find code entry point?"**
→ Returns Knowledge about RESET vector + $FFFC Register + methodology

**"What is LoROM vs HiROM?"**
→ Returns comprehensive mapping mode knowledge + memory regions

**"How to reverse-engineer SNES ROM?"**
→ Returns step-by-step methodology + related tools and concepts

### RAG Integration

All knowledge entries are:
- ✅ Tagged for keyword matching
- ✅ Categorized as 'rom-reverse-engineering'
- ✅ Linked to related registers and memory regions
- ✅ Include source URLs for verification
- ✅ Optimized for relevance scoring and reranking

The enhanced RAG pipeline will automatically:
1. Extract keywords from user queries
2. Match against ROM knowledge tags
3. Score and rerank by relevance
4. Inject comprehensive context before responses

## 📖 Documentation References

### Official Documentation
- [SNESdev Wiki - ROM Header](https://snes.nesdev.org/wiki/ROM_header)
- [SNESdev Wiki - Memory Map](https://snes.nesdev.org/wiki/Memory_map)
- [SNESdev Wiki - CPU Vectors](https://snes.nesdev.org/wiki/CPU_vectors)
- [SNESLab - SNES ROM Header](https://sneslab.net/wiki/SNES_ROM_Header)

### Community Resources
- [RetroReversing - SNES](https://www.retroreversing.com/snes/)
- [pvsneslib Wiki - HiROM and FastROM](https://github.com/alekmaul/pvsneslib/wiki/HiRom-and-FastRom)
- [Super Famicom Dev Wiki - Writing the Header](https://wiki.superfamicom.org/writing-the-header)

## ✅ Verification

### Query the Knowledge Graph

```cypher
// Count ROM knowledge entries
MATCH (k:Knowledge)
WHERE k.category = 'rom-reverse-engineering'
RETURN count(k) as total

// View all ROM header registers
MATCH (r:Register)
WHERE r.category = 'ROM Header'
RETURN r.address, r.name, r.description

// View ROM memory regions
MATCH (m:MemoryRegion)
WHERE m.type = 'ROM'
RETURN m.name, m.start_addr, m.end_addr

// Find knowledge about LoROM
MATCH (k:Knowledge)
WHERE any(tag IN k.tags WHERE tag = 'lorom')
RETURN k.topic, k.content
```

### Test RAG Retrieval

```bash
# Via Python - set environment variables first
export NEO4J_URI="bolt://localhost:7687"
export NEO4J_USER="neo4j"
export NEO4J_PASSWORD="snes-graph-2024"

# Test ROM knowledge retrieval
cd tools
python3 << 'EOF'
import sys
import os
# Running from repo root/tools; make tools importable without absolute paths
sys.path.insert(0, '.')

from neo4j_rag import SNESRAGPipeline

rag = SNESRAGPipeline()

# Test queries
queries = [
    'How do I validate ROM checksum?',
    'What is the ROM Map Mode register?',
    'Where is the RESET vector?',
    'What is the difference between LoROM and HiROM?'
]

for query in queries:
    print(f'\n{"="*60}')
    print(f'Query: "{query}"')
    print(f'{"="*60}')
    context = rag.build_context(query, max_items=5)
    print(context)

rag.close()
EOF
```

**Expected Output**: Rich context including:
- ROM header registers ($FFD5-$FFDE)
- Interrupt vector registers ($FFEA, $FFEE, $FFFC)
- Knowledge about ROM structure, mapping modes, validation
- Memory regions for LoROM, HiROM, ROM Header

## 🎉 Summary

Successfully completed comprehensive SNES ROM reverse-engineering knowledge capture and Neo4j graph enrichment:

- ✅ **12 Knowledge nodes** covering ROM structure, mapping modes, and methodologies
- ✅ **10 Register nodes** for ROM header fields and interrupt vectors
- ✅ **4 Memory Region nodes** defining ROM address spaces
- ✅ **Multiple relationships** linking related concepts
- ✅ **Source attribution** with URLs to official documentation
- ✅ **RAG-optimized** with tags and categorization
- ✅ **Automated tooling** for future knowledge updates

The Neo4j knowledge graph is now a comprehensive resource for SNES ROM reverse-engineering that will enhance Claude's ability to provide accurate, sourced guidance on ROM hacking, disassembly, and SNES development.

---

**Generated**: 2025-10-18
**Sources**: SNES MCP Server, SNESdev Wiki, SNESLab, RetroReversing, Exa Code Context
**Tool**: `tools/populate_rom_knowledge.py`

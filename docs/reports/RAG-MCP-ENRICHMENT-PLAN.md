# RAG MCP Enrichment Plan

## Executive Summary

This document outlines a concrete plan to enhance the existing Neo4j RAG pipeline with real-time MCP server integration, transforming the Claude Code hooks from providing **curated knowledge** to providing **comprehensive, multi-source domain expertise**.

**Current State**: RAG hook queries Neo4j for mods, registers, components, and knowledge based on keyword matching.

**Enhanced State**: RAG hook combines Neo4j with 6+ MCP servers to provide:
- Real-time hardware documentation from official Nintendo manuals
- Cross-repository code discovery (C, ASM, emulator implementations)
- Context-aware helpers (auto-detect instructions, addresses, graphics needs)
- Template-driven implementation suggestions
- Multi-level explanations (hardware ↔ assembly ↔ C ↔ emulator)

---

## 🎯 8 Strategic Enrichments

### 1. Multi-Source Hardware Context Injection

**Problem**: Neo4j provides register names and basic descriptions, but lacks authoritative documentation and usage patterns.

**Solution**: Combine Neo4j with `snes-mcp-server` for deep hardware context.

**Implementation**:
```python
# In tools/neo4j_rag.py

def get_hardware_context_enhanced(keywords: Set[str]) -> Dict:
    """Enhanced hardware context from Neo4j + MCP servers"""

    # Existing Neo4j query
    neo4j_registers = get_relevant_registers(keywords)

    # NEW: Query MCP server for detailed register info
    mcp_details = []
    for reg in neo4j_registers[:3]:  # Top 3 registers
        # Call: mcp__snes-mcp-server__register_info
        # Parameters: address=reg['address']
        # Returns: Bit fields, timing, usage patterns, manual references
        mcp_details.append({
            'address': reg['address'],
            'name': reg['name'],
            'bit_fields': '...',  # From MCP
            'timing': '...',      # From MCP
            'manual_ref': '...'   # From MCP
        })

    # NEW: Query Nintendo manual for context
    if any(k in keywords for k in ["ppu", "sprite", "dma"]):
        # Call: mcp__snes-mcp-server__manual_search
        # Parameters: query="PPU sprites", type="sections"
        # Returns: Manual sections with page numbers
        manual_sections = []  # From MCP

    return {
        'neo4j': neo4j_registers,
        'mcp_details': mcp_details,
        'manual_sections': manual_sections
    }
```

**Hook Integration**:
```python
# In .claude/hooks/user_prompt_submit.py

# Add MCP client helper
from mcp_client import call_mcp_tool

def inject_rag_context(user_prompt: str):
    # ... existing code ...

    # NEW: Add hardware enrichment
    if registers:
        hw_context = get_hardware_context_enhanced(keywords)
        context_parts.append(format_hardware_context(hw_context))
```

**Value**:
- Authoritative Nintendo manual references
- Bit-level register documentation
- Timing and usage patterns
- Cross-references between registers

**Effort**: 4-6 hours
**Priority**: HIGH

---

### 2. Cross-Repository Code Discovery

**Problem**: RAG shows component names but not actual code locations where they're implemented.

**Solution**: Query `zelda3`, `zelda3-disasm`, and `bsnes` MCP servers to find concrete implementations.

**Implementation**:
```python
# In tools/neo4j_rag.py

def find_component_implementations(component_name: str) -> Dict:
    """Find component implementations across all codebases"""

    implementations = {
        'c_source': [],      # From zelda3
        'assembly': [],      # From zelda3-disasm
        'emulator': []       # From bsnes
    }

    # Query zelda3 C source
    # Call: mcp__zelda3__find_functions
    # Parameters: function_name=component_name
    implementations['c_source'] = [
        # {'file': 'src/sprite.c', 'line': 1234, 'function': 'Sprite_Main'}
    ]

    # Query zelda3-disasm assembly
    # Call: mcp__zelda3-disasm__analyze_game_components
    # Parameters: component=component_name
    implementations['assembly'] = [
        # {'file': 'bank_03.asm', 'line': 567, 'label': 'Sprite_DrawMultiple'}
    ]

    # Query bsnes emulator
    # Call: mcp__bsnes__search_code
    # Parameters: query=component_name, file_type="cpp"
    implementations['emulator'] = [
        # {'file': 'snes/ppu/sprite.cpp', 'line': 890, 'function': 'PPU::renderSprite'}
    ]

    return implementations
```

**Formatting**:
```python
def format_code_locations(implementations: Dict) -> str:
    """Format code locations for display"""

    output = ["📍 **Code Locations**:"]

    if implementations['c_source']:
        output.append("\n**C Implementation (zelda3)**:")
        for impl in implementations['c_source']:
            output.append(f"  - `{impl['file']}:{impl['line']}` - {impl['function']}")

    if implementations['assembly']:
        output.append("\n**Assembly (zelda3-disasm)**:")
        for impl in implementations['assembly']:
            output.append(f"  - `{impl['file']}:{impl['line']}` - {impl['label']}")

    if implementations['emulator']:
        output.append("\n**Emulator Implementation (bsnes)**:")
        for impl in implementations['emulator']:
            output.append(f"  - `{impl['file']}:{impl['line']}` - {impl['function']}")

    return "\n".join(output)
```

**Value**:
- Instant navigation to actual code
- Understanding across 3 abstraction levels
- Compare implementations side-by-side
- See how emulators interpret game code

**Effort**: 6-8 hours
**Priority**: HIGH

---

### 3. Template-Driven Mod Suggestions

**Problem**: RAG shows existing mods but doesn't help create new ones.

**Solution**: Use `snes-mcp-server` code templates to suggest implementation patterns.

**Implementation**:
```python
# In tools/neo4j_rag.py

def suggest_implementation_template(user_prompt: str, mod_type: str) -> Dict:
    """Suggest code templates for mod creation"""

    # Map mod types to assembly templates
    template_map = {
        'magic': 'multiplication',      # For stat modifications
        'speed': 'multiplication',      # For movement speed
        'visual': 'hdma_gradient',      # For visual effects
        'sprite': 'sprite_setup',       # For sprite mods
        'input': 'controller_read',     # For input mods
        'graphics': 'bg_setup'          # For background mods
    }

    # Detect if user wants to create something
    creation_keywords = ['create', 'make', 'implement', 'build', 'add', 'new']
    is_creation = any(word in user_prompt.lower() for word in creation_keywords)

    if is_creation and mod_type in template_map:
        template_name = template_map[mod_type]

        # Call: mcp__snes-mcp-server__generate_asm_template
        # Parameters: template=template_name, options={'language': 'ca65', 'mode': '16bit'}
        template_code = "..."  # From MCP

        # Call: mcp__snes-mcp-server__register_info
        # Get relevant registers for this mod type
        relevant_registers = []  # From MCP

        return {
            'template_name': template_name,
            'template_code': template_code,
            'registers': relevant_registers,
            'memory_regions': [],  # From memory_map tool
        }

    return None
```

**Formatting**:
```python
def format_template_suggestion(suggestion: Dict) -> str:
    """Format template suggestion for display"""

    output = ["💡 **Implementation Template**:"]
    output.append(f"\nTemplate: `{suggestion['template_name']}`")

    if suggestion['registers']:
        output.append("\n**Required Registers**:")
        for reg in suggestion['registers']:
            output.append(f"  - `{reg['address']}` ({reg['name']}): {reg['description']}")

    if suggestion['memory_regions']:
        output.append("\n**Memory Layout**:")
        for region in suggestion['memory_regions']:
            output.append(f"  - `{region['range']}`: {region['type']}")

    output.append(f"\n**Example Code**:\n```asm\n{suggestion['template_code'][:300]}...\n```")

    return "\n".join(output)
```

**Value**:
- Bridge from idea to implementation
- Provide working code templates
- Show required registers and memory
- Reduce barrier to creating new mods

**Effort**: 4-6 hours
**Priority**: MEDIUM

---

### 4. Multi-Level Implementation Guidance

**Problem**: RAG explains things at one abstraction level, not showing how hardware/assembly/C/emulator connect.

**Solution**: Provide synchronized explanations across all levels.

**Implementation**:
```python
# In tools/neo4j_rag.py

def build_multi_level_explanation(topic: str, keywords: Set[str]) -> Dict:
    """Explain concept at hardware, assembly, and high-level"""

    explanation = {
        'hardware': None,
        'assembly': None,
        'c_source': None,
        'emulator': None
    }

    # Hardware level - from Nintendo manuals
    # Call: mcp__snes-mcp-server__manual_search
    # Parameters: query=topic, type="sections"
    explanation['hardware'] = {
        'source': 'Nintendo Manual Book 1, Section X',
        'summary': '...',
        'diagram': '...'
    }

    # Assembly level - from zelda3-disasm
    # Call: mcp__zelda3-disasm__search_code
    # Parameters: query=topic
    explanation['assembly'] = {
        'files': ['bank_00.asm:1234', 'bank_02.asm:5678'],
        'labels': ['DMA_Transfer', 'HDMA_Setup']
    }

    # C level - from zelda3
    # Call: mcp__zelda3__search_code
    # Parameters: query=topic
    explanation['c_source'] = {
        'files': ['src/load_gfx.c:456'],
        'functions': ['Dma_TransferVram', 'Hdma_SetupGradient']
    }

    # Emulator level - from bsnes
    # Call: mcp__bsnes__analyze_emulation_core
    # Parameters: component='dma'
    explanation['emulator'] = {
        'implementation': 'bsnes-plus/snes/dma/dma.cpp:123',
        'timing': '8 master clock cycles per byte',
        'notes': 'Handles both DMA and HDMA modes'
    }

    return explanation
```

**Formatting**:
```python
def format_multi_level_explanation(explanation: Dict) -> str:
    """Format multi-level explanation"""

    output = ["🔬 **Multi-Level Understanding**:"]

    if explanation['hardware']:
        hw = explanation['hardware']
        output.append(f"\n**Hardware** ({hw['source']}):")
        output.append(f"  {hw['summary']}")

    if explanation['assembly']:
        asm = explanation['assembly']
        output.append("\n**Assembly Implementation**:")
        for file in asm['files'][:3]:
            output.append(f"  - `{file}`")

    if explanation['c_source']:
        c = explanation['c_source']
        output.append("\n**C Implementation** (zelda3):")
        for file in c['files'][:3]:
            output.append(f"  - `{file}`")

    if explanation['emulator']:
        emu = explanation['emulator']
        output.append("\n**Emulator Implementation**:")
        output.append(f"  - `{emu['implementation']}`")
        output.append(f"  - Timing: {emu['timing']}")

    return "\n".join(output)
```

**Value**:
- Complete understanding across all layers
- See how concepts map between abstractions
- Authoritative manual references
- Real code examples at each level

**Effort**: 6-8 hours
**Priority**: HIGH

---

### 5. Context-Aware Instruction Lookup

**Problem**: When discussing assembly code, no instruction-level help is provided.

**Solution**: Auto-detect 65816 instructions and inject reference information.

**Implementation**:
```python
# In tools/neo4j_rag.py

import re

def detect_and_explain_instructions(user_prompt: str) -> List[Dict]:
    """Auto-detect assembly instructions and provide help"""

    # 65816 instruction mnemonics
    instruction_pattern = r'\b(LDA|STA|LDX|STX|LDY|STY|JSR|JSL|JMP|JML|' \
                         r'BEQ|BNE|BCC|BCS|BMI|BPL|BVC|BVS|BRA|BRL|' \
                         r'ADC|SBC|AND|ORA|EOR|CMP|CPX|CPY|' \
                         r'INC|DEC|INX|DEX|INY|DEY|' \
                         r'ASL|LSR|ROL|ROR|' \
                         r'PHP|PLP|PHA|PLA|PHX|PLX|PHY|PLY|PHB|PLB|PHD|PLD|PHK|' \
                         r'RTI|RTS|RTL|' \
                         r'SEI|CLI|SEC|CLC|SED|CLD|SEP|REP|XCE|' \
                         r'NOP|WDM|COP|BRK|WAI|STP|' \
                         r'TXA|TAX|TYA|TAY|TXS|TSX|TXY|TYX|TCD|TDC|TCS|TSC|XBA)\b'

    instructions = re.findall(instruction_pattern, user_prompt.upper())

    if not instructions:
        return []

    # Get unique instructions
    unique_instructions = list(set(instructions))

    instruction_help = []
    for instr in unique_instructions[:5]:  # Limit to 5 to avoid clutter
        # Call: mcp__snes-mcp-server__lookup_instruction
        # Parameters: mnemonic=instr
        help_info = {
            'mnemonic': instr,
            'description': '...',        # From MCP
            'modes': '...',              # From MCP
            'cycles': '...',             # From MCP
            'flags': '...',              # From MCP
            'examples': '...'            # From MCP
        }
        instruction_help.append(help_info)

    return instruction_help
```

**Formatting**:
```python
def format_instruction_help(instructions: List[Dict]) -> str:
    """Format instruction help"""

    if not instructions:
        return ""

    output = ["🔧 **Detected 65816 Instructions**:"]

    for instr in instructions:
        output.append(f"\n**{instr['mnemonic']}**: {instr['description']}")
        output.append(f"  - Modes: {instr['modes']}")
        output.append(f"  - Cycles: {instr['cycles']}")
        output.append(f"  - Flags: {instr['flags']}")

    return "\n".join(output)
```

**Value**:
- Instant instruction reference
- No need to look up documentation
- Context-aware - only shows what's relevant
- Reduces context switching

**Effort**: 2-3 hours
**Priority**: HIGH (Quick win!)

---

### 6. Memory Region Awareness

**Problem**: When addresses are mentioned, no context about what memory region they're in.

**Solution**: Auto-detect SNES addresses and explain memory regions.

**Implementation**:
```python
# In tools/neo4j_rag.py

import re

def detect_and_explain_addresses(user_prompt: str) -> List[Dict]:
    """Detect memory addresses and explain regions"""

    # Detect SNES addresses in $xxxx or $xxxxxx format
    address_pattern = r'\$([0-9A-Fa-f]{4,6})\b'
    addresses = re.findall(address_pattern, user_prompt)

    if not addresses:
        return []

    # Get unique addresses
    unique_addresses = list(set(addresses))

    address_info = []
    for addr in unique_addresses[:10]:  # Limit to 10
        # Call: mcp__snes-mcp-server__memory_map
        # Parameters: address=f"${addr}"

        info = {
            'address': f'${addr}',
            'region': '...',           # e.g., "WRAM", "ROM", "Hardware Registers"
            'type': '...',             # e.g., "RAM", "ROM", "I/O"
            'access': '...',           # e.g., "Read/Write", "Read-only"
            'description': '...',      # Detailed description
        }

        # Special handling for hardware registers
        if addr.startswith('2') or addr.startswith('4'):
            # Call: mcp__snes-mcp-server__register_info
            # Parameters: address=f"${addr}"
            info['register_name'] = '...'
            info['register_desc'] = '...'

        address_info.append(info)

    return address_info
```

**Formatting**:
```python
def format_address_info(addresses: List[Dict]) -> str:
    """Format address information"""

    if not addresses:
        return ""

    output = ["📍 **Memory Addresses Referenced**:"]

    for addr in addresses:
        if 'register_name' in addr:
            # Hardware register
            output.append(f"\n**{addr['address']}** - {addr['register_name']}")
            output.append(f"  {addr['register_desc']}")
        else:
            # Memory region
            output.append(f"\n**{addr['address']}** - {addr['region']} ({addr['type']})")
            output.append(f"  Access: {addr['access']}")
            if addr['description']:
                output.append(f"  {addr['description']}")

    return "\n".join(output)
```

**Value**:
- Instant memory region context
- Understand register vs RAM vs ROM
- See access permissions
- Detailed descriptions

**Effort**: 2-3 hours
**Priority**: HIGH (Quick win!)

---

### 7. Sprite & Graphics Calculation Helper

**Problem**: Graphics programming requires complex calculations, no help provided.

**Solution**: Detect graphics queries and inject calculation helpers.

**Implementation**:
```python
# In tools/neo4j_rag.py

def provide_graphics_helpers(keywords: Set[str]) -> Dict:
    """Provide sprite/tile calculation helpers"""

    graphics_keywords = ['sprite', 'oam', 'tile', 'chr', 'graphics', 'vram', 'palette']

    if not any(k in keywords for k in graphics_keywords):
        return None

    # Call: mcp__snes-mcp-server__sprite_calc (get resource)
    # URI: snes://reference/sprite-calc
    sprite_guide = "..."  # From MCP resource

    # Provide common calculations
    helpers = {
        'tile_address': 'base_addr + (tile_num × tile_size)',
        'oam_position': 'X (9-bit), Y (8-bit) with size flags',
        'palette_offset': 'palette_num × colors_per_palette',
        'chr_convert': '2bpp: 16 bytes/tile, 4bpp: 32 bytes/tile, 8bpp: 64 bytes/tile'
    }

    # Get relevant registers
    # Call: mcp__snes-mcp-server__register_info
    # Parameters: category="ppu", search="sprite"
    sprite_registers = []  # From MCP

    return {
        'guide': sprite_guide,
        'helpers': helpers,
        'registers': sprite_registers
    }
```

**Formatting**:
```python
def format_graphics_helpers(helpers: Dict) -> str:
    """Format graphics helpers"""

    if not helpers:
        return ""

    output = ["🎨 **Graphics Programming Helper**:"]

    output.append("\n**Common Calculations**:")
    for calc, formula in helpers['helpers'].items():
        output.append(f"  - {calc}: `{formula}`")

    if helpers['registers']:
        output.append("\n**Relevant Registers**:")
        for reg in helpers['registers'][:5]:
            output.append(f"  - `{reg['address']}` ({reg['name']})")

    output.append("\n💡 Use `mcp__snes-mcp-server__sprite_calc` for specific calculations")

    return "\n".join(output)
```

**Value**:
- Reduces graphics programming errors
- Common formulas at fingertips
- Relevant register references
- Link to calculation tools

**Effort**: 3-4 hours
**Priority**: MEDIUM

---

### 8. Development Guidelines Integration

**Problem**: No official Nintendo best practices surfaced.

**Solution**: Surface relevant development guidelines from official manuals.

**Implementation**:
```python
# In tools/neo4j_rag.py

def get_development_guidelines(keywords: Set[str]) -> List[Dict]:
    """Surface Nintendo's official programming guidelines"""

    # Map keywords to guideline topics
    guidelines_map = {
        'dma': ['performance', 'timing'],
        'hdma': ['performance', 'timing'],
        'sprite': ['performance', 'graphics'],
        'audio': ['audio', 'performance'],
        'interrupt': ['timing', 'general'],
        'nmi': ['timing', 'general'],
        'irq': ['timing', 'general'],
        'vblank': ['timing', 'performance']
    }

    relevant_topics = set()
    for keyword in keywords:
        if keyword in guidelines_map:
            relevant_topics.update(guidelines_map[keyword])

    if not relevant_topics:
        return []

    guidelines = []
    for topic in relevant_topics:
        # Call: mcp__snes-mcp-server__dev_guidelines
        # Parameters: topic=topic, severity="all"

        topic_guidelines = []  # From MCP
        # Returns: List of cautions, warnings, tips, notes

        guidelines.extend(topic_guidelines)

    return guidelines[:5]  # Limit to 5 most relevant
```

**Formatting**:
```python
def format_dev_guidelines(guidelines: List[Dict]) -> str:
    """Format development guidelines"""

    if not guidelines:
        return ""

    output = ["⚠️  **Nintendo Development Guidelines**:"]

    # Group by severity
    severity_emoji = {
        'caution': '🚨',
        'warning': '⚠️',
        'note': '📝',
        'tip': '💡'
    }

    for guideline in guidelines:
        emoji = severity_emoji.get(guideline['severity'], '📌')
        output.append(f"\n{emoji} **{guideline['severity'].upper()}** ({guideline['topic']}):")
        output.append(f"  {guideline['content']}")

    return "\n".join(output)
```

**Value**:
- Prevent common mistakes
- Official Nintendo guidance
- Severity-based warnings
- Topic-specific best practices

**Effort**: 3-4 hours
**Priority**: LOW (Nice to have)

---

## 🏗️ Implementation Architecture

### MCP Client Helper Module

Create a new module to handle MCP tool calls from the RAG pipeline:

```python
# tools/mcp_client.py

"""
MCP Client Helper for RAG Pipeline

This module provides a simplified interface for calling MCP tools
from the RAG pipeline without requiring full MCP client setup.
"""

import subprocess
import json
from typing import Dict, Any, Optional

class MCPClient:
    """Lightweight MCP client for RAG pipeline"""

    def __init__(self, server_name: str):
        self.server_name = server_name

    def call_tool(self, tool_name: str, params: Dict[str, Any]) -> Optional[Dict]:
        """Call an MCP tool and return results"""
        try:
            # Use Claude Code's MCP infrastructure
            # This is a simplified example - actual implementation
            # would integrate with Claude Code's MCP client

            result = subprocess.run(
                ['claude-code-mcp', 'call', self.server_name, tool_name],
                input=json.dumps(params),
                capture_output=True,
                text=True,
                timeout=5  # 5 second timeout
            )

            if result.returncode == 0:
                return json.loads(result.stdout)
            else:
                return None

        except Exception:
            return None

    def get_resource(self, uri: str) -> Optional[str]:
        """Get an MCP resource"""
        try:
            result = subprocess.run(
                ['claude-code-mcp', 'resource', uri],
                capture_output=True,
                text=True,
                timeout=5
            )

            if result.returncode == 0:
                return result.stdout
            else:
                return None

        except Exception:
            return None


# Convenience functions for specific MCP servers

def snes_mcp(tool: str, **params) -> Optional[Dict]:
    """Call snes-mcp-server tool"""
    client = MCPClient('snes-mcp-server')
    return client.call_tool(f'mcp__snes-mcp-server__{tool}', params)

def zelda3_mcp(tool: str, **params) -> Optional[Dict]:
    """Call zelda3 MCP server tool"""
    client = MCPClient('zelda3')
    return client.call_tool(f'mcp__zelda3__{tool}', params)

def zelda3_disasm_mcp(tool: str, **params) -> Optional[Dict]:
    """Call zelda3-disasm MCP server tool"""
    client = MCPClient('zelda3-disasm')
    return client.call_tool(f'mcp__zelda3-disasm__{tool}', params)

def bsnes_mcp(tool: str, **params) -> Optional[Dict]:
    """Call bsnes MCP server tool"""
    client = MCPClient('bsnes')
    return client.call_tool(f'mcp__bsnes__{tool}', params)


# Example usage:
#
# from mcp_client import snes_mcp, zelda3_mcp
#
# # Lookup instruction
# result = snes_mcp('lookup_instruction', mnemonic='LDA')
#
# # Find functions in zelda3
# result = zelda3_mcp('find_functions', function_name='sprite')
```

### Enhanced RAG Pipeline

Update `tools/neo4j_rag.py` to integrate MCP calls:

```python
# In tools/neo4j_rag.py

# Add at top
try:
    from mcp_client import snes_mcp, zelda3_mcp, zelda3_disasm_mcp, bsnes_mcp
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False


class SNESRAGPipeline:
    # ... existing code ...

    def build_context(self, query: str, max_items: int = 10) -> str:
        """Build RAG context with MCP enrichment"""

        if not self.is_available():
            return ""

        # Extract keywords (existing)
        keywords = self.extract_keywords(query)

        if not keywords:
            return ""

        context_parts = []

        # === EXISTING NEO4J QUERIES ===
        mods = self.get_relevant_mods(keywords)
        registers = self.get_relevant_registers(keywords)
        components = self.get_relevant_components(keywords)
        knowledge = self.get_relevant_knowledge(keywords)

        # === NEW MCP ENRICHMENTS ===

        if MCP_AVAILABLE:
            # 1. Instruction help (if assembly detected)
            instruction_help = detect_and_explain_instructions(query)
            if instruction_help:
                context_parts.append(format_instruction_help(instruction_help))

            # 2. Memory region awareness (if addresses detected)
            address_info = detect_and_explain_addresses(query)
            if address_info:
                context_parts.append(format_address_info(address_info))

            # 3. Code discovery (if components found)
            if components:
                for comp in components[:2]:  # Top 2 components
                    impl = find_component_implementations(comp['name'])
                    if impl:
                        context_parts.append(format_code_locations(impl))

            # 4. Graphics helpers (if graphics-related)
            graphics_help = provide_graphics_helpers(keywords)
            if graphics_help:
                context_parts.append(format_graphics_helpers(graphics_help))

            # 5. Development guidelines (if applicable)
            guidelines = get_development_guidelines(keywords)
            if guidelines:
                context_parts.append(format_dev_guidelines(guidelines))

        # === EXISTING NEO4J FORMATTING ===
        # ... existing formatting code ...

        # Combine all context
        if not context_parts:
            return ""

        header = "🧠 **Enhanced Knowledge Context** (Neo4j + MCP Servers):"
        footer = f"\n_Retrieved from Neo4j graph + {len(context_parts)} MCP enrichments_"

        return "\n\n".join([header] + context_parts + [footer])
```

---

## 📊 Implementation Phases

### Phase 1: Quick Wins (Week 1) - 6-8 hours

**Goal**: Get immediate value with minimal complexity

**Tasks**:
1. Create `tools/mcp_client.py` helper module (2 hours)
2. Implement instruction auto-lookup (2 hours)
3. Implement memory region awareness (2 hours)
4. Test and debug (2 hours)

**Deliverables**:
- Auto-detect assembly instructions → show reference
- Auto-detect addresses → show memory regions
- Updated RAG hook with 2 new enrichments

**Success Metrics**:
- Instructions detected in 80%+ of assembly queries
- Addresses explained in 90%+ of queries mentioning addresses
- No performance degradation (< 200ms added latency)

---

### Phase 2: Deep Integration (Week 2-3) - 12-16 hours

**Goal**: Comprehensive cross-repository context

**Tasks**:
1. Implement cross-repository code discovery (4 hours)
2. Implement multi-level explanations (4 hours)
3. Enhance hardware context with manuals (3 hours)
4. Add template suggestions (3 hours)
5. Testing and optimization (2 hours)

**Deliverables**:
- Find code across zelda3 + disasm + bsnes
- Hardware + ASM + C + Emulator explanations
- Nintendo manual references for registers
- Code templates for common mods

**Success Metrics**:
- Code found in 3+ repositories for 60%+ of component queries
- Multi-level explanations for 70%+ of "how does X work" queries
- Template suggestions for 80%+ of "create/make/implement" queries

---

### Phase 3: Polish & Advanced Features (Week 4) - 6-8 hours

**Goal**: Complete the enrichment suite

**Tasks**:
1. Add graphics calculation helpers (3 hours)
2. Integrate development guidelines (3 hours)
3. Performance optimization (2 hours)
4. Documentation and examples (2 hours)

**Deliverables**:
- Graphics programming helpers
- Nintendo best practice warnings
- Optimized performance (< 300ms total)
- Complete documentation

**Success Metrics**:
- Graphics helpers shown for 90%+ of sprite/OAM queries
- Guidelines surfaced for 50%+ of relevant topics
- All enrichments < 300ms combined latency
- Documentation covers all features

---

## 🎯 Expected Outcomes

### Before Enrichment (Current State)

**User**: "How do I modify the magic system?"

**RAG Context**:
```
🧠 Neo4j Knowledge Graph Context:

🎮 Relevant Mods:
  - infinite-magic (magic): Never run out of magic power
    Affects: player | Bytes changed: 7

📦 Relevant Components:
  - player (player): Core player character logic
```

### After Enrichment (Enhanced State)

**User**: "How do I modify the magic system?"

**RAG Context**:
```
🧠 Enhanced Knowledge Context (Neo4j + MCP Servers):

🎮 Relevant Mods:
  - infinite-magic (magic): Never run out of magic power
    Affects: player | Bytes changed: 7

📦 Relevant Components:
  - player (player): Core player character logic

📍 Code Locations:

**C Implementation (zelda3)**:
  - `src/player.c:1234` - Link_CheckMagic()
  - `src/player.c:1567` - Link_DecrementMagic()

**Assembly (zelda3-disasm)**:
  - `bank_07.asm:2345` - Player_DecrementMagic
  - `bank_0E.asm:4567` - Magic_CheckIfEnough

**Emulator Implementation (bsnes)**:
  - `bsnes-plus/snes/cpu/memory.cpp:789` - Memory read handler

💡 Implementation Template:

Template: `multiplication`

**Required Registers**:
  - `$211B` (M7A): Multiplicand A (16-bit)
  - `$211C` (M7B): Multiplicand B (8-bit)

**Example Code**:
```asm
  LDA #$00      ; Load 0 (infinite magic)
  STA $7EF36E   ; Store to magic counter
```

🔧 Detected 65816 Instructions:

**LDA**: Load Accumulator from Memory
  - Modes: Immediate, Direct Page, Absolute, Indexed
  - Cycles: 2-6 depending on mode
  - Flags: N, Z

**STA**: Store Accumulator to Memory
  - Modes: Direct Page, Absolute, Indexed
  - Cycles: 3-6 depending on mode
  - Flags: None

📍 Memory Addresses Referenced:

**$7EF36E** - WRAM (RAM)
  Access: Read/Write
  Game data: Player magic counter

⚠️  Nintendo Development Guidelines:

📝 NOTE (performance):
  When modifying RAM frequently, consider grouping writes during VBlank

_Retrieved from Neo4j graph + 5 MCP enrichments_
```

---

## 🚀 Getting Started

### Step 1: Set up MCP client infrastructure

```bash
# Test that MCP servers are accessible
cd /path/to/your/snes-repo
npm run build  # Build all MCP servers

# Test individual servers
node snes-mcp-server/dist/index.js
node zelda3/mcp-server/index.js
```

### Step 2: Create MCP client helper

```bash
# Create the helper module
touch tools/mcp_client.py

# Copy implementation from "MCP Client Helper Module" section above
```

### Step 3: Update RAG pipeline

```bash
# Edit tools/neo4j_rag.py
# Add MCP imports and enrichment functions
```

### Step 4: Test individual enrichments

```bash
# Test instruction detection
python3 -c "from neo4j_rag import detect_and_explain_instructions; print(detect_and_explain_instructions('LDA #\$00'))"

# Test address detection
python3 -c "from neo4j_rag import detect_and_explain_addresses; print(detect_and_explain_addresses('Store to \$7EF36E'))"
```

### Step 5: Test end-to-end

```bash
# Source Neo4j environment
source .env.neo4j

# Test RAG pipeline
python3 tools/neo4j_rag.py "How do I modify the magic system using LDA \$7EF36E?"

# Should show:
# - Neo4j context (mods, components)
# - Instruction help (LDA)
# - Address info ($7EF36E)
# - Code locations (if implemented)
```

### Step 6: Deploy to Claude Code hook

The hook at `.claude/hooks/user_prompt_submit.py` already calls the RAG pipeline via `inject_rag_context()`, so once you update `neo4j_rag.py`, the enrichments will automatically appear in all Claude Code conversations!

---

## 🧪 Testing Strategy

### Unit Tests

```python
# tests/test_rag_enrichments.py

import unittest
from tools.neo4j_rag import (
    detect_and_explain_instructions,
    detect_and_explain_addresses,
    find_component_implementations
)

class TestRAGEnrichments(unittest.TestCase):

    def test_instruction_detection(self):
        """Test that assembly instructions are detected"""
        result = detect_and_explain_instructions("Use LDA #$00 and STA $7E")
        self.assertEqual(len(result), 2)
        self.assertIn('LDA', [r['mnemonic'] for r in result])
        self.assertIn('STA', [r['mnemonic'] for r in result])

    def test_address_detection(self):
        """Test that addresses are detected"""
        result = detect_and_explain_addresses("Write to $2100 and $7EF36E")
        self.assertEqual(len(result), 2)
        addresses = [r['address'] for r in result]
        self.assertIn('$2100', addresses)
        self.assertIn('$7EF36E', addresses)

    def test_code_discovery(self):
        """Test that code is found across repos"""
        result = find_component_implementations('sprite')
        self.assertIsNotNone(result['c_source'])
        self.assertIsNotNone(result['assembly'])
        self.assertIsNotNone(result['emulator'])
```

### Integration Tests

```bash
# Test full RAG pipeline
python3 tools/neo4j_rag.py "How does LDA work with $2100?"

# Expected output should include:
# - LDA instruction reference
# - $2100 register information (INIDISP)
# - Code examples from repos
```

### Performance Tests

```python
# tests/test_rag_performance.py

import time
from tools.neo4j_rag import get_rag_context

def test_enrichment_performance():
    """Ensure enrichments don't add excessive latency"""

    queries = [
        "How do I modify magic?",
        "Use LDA #$00 and STA $7EF36E",
        "What PPU registers control sprites?",
        "How does DMA work?"
    ]

    for query in queries:
        start = time.time()
        context = get_rag_context(query)
        elapsed = time.time() - start

        print(f"{query[:30]}... : {elapsed*1000:.0f}ms")
        assert elapsed < 0.5, f"Query took too long: {elapsed}s"
```

---

## 📈 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Instruction Detection Rate** | 80% | % of assembly queries with detected instructions |
| **Address Explanation Rate** | 90% | % of address mentions with memory info |
| **Code Discovery Success** | 60% | % of component queries finding code in 3+ repos |
| **Template Suggestion Rate** | 80% | % of "create/make" queries with templates |
| **Latency** | < 300ms | Total added latency from all enrichments |
| **Error Rate** | < 5% | % of queries where MCP calls fail |
| **User Satisfaction** | Qualitative | Does context feel more comprehensive? |

---

## 🔮 Future Enhancements

### Beyond Phase 3

1. **Semantic Search**: Use embeddings for better keyword matching
2. **Conversation Memory**: Track what was discussed in this session
3. **Learning Mode**: Auto-extract knowledge from conversations into Neo4j
4. **Visual Diagrams**: Generate register bit diagrams, memory maps
5. **Code Similarity**: Find similar code patterns across repos
6. **Performance Profiling**: Suggest optimizations based on manual guidelines
7. **Multi-Project**: Extend to other SNES games
8. **Natural Language Queries**: "Find all places where sprites are drawn" → code locations

---

## 📚 Resources

### Documentation
- **This Plan**: `docs/RAG-MCP-ENRICHMENT-PLAN.md`
- **Current RAG Docs**: `../guides/rag-integration.md`
- **MCP Server List**: `.mcp.json`
- **SNES Context Command**: `.claude/commands/snes-context.md`

### Code Locations
- **RAG Pipeline**: `tools/neo4j_rag.py`
- **Hook Integration**: `.claude/hooks/user_prompt_submit.py`
- **MCP Client** (to create): `tools/mcp_client.py`

### MCP Servers
- **snes-mcp-server**: `snes-mcp-server/` - 14 tools + manual access
- **zelda3**: `zelda3/mcp-server/` - C source search
- **zelda3-disasm**: `zelda3-disasm/mcp-server/` - Assembly search
- **bsnes**: `bsnes-plus/mcp-server/` - Emulator source search
- **snes9x**: `snes9x/mcp-server/` - Alternative emulator search
- **snes-mister**: `SNES_MiSTer/mcp-server/` - FPGA HDL search

---

## ✅ Next Steps

1. **Review this plan** and prioritize which enrichments to implement first
2. **Create MCP client helper** (`tools/mcp_client.py`)
3. **Implement Phase 1** (instruction + address detection) - Quick wins!
4. **Test in real conversations** and gather feedback
5. **Iterate** based on what provides most value
6. **Document learnings** and update this plan

---

**Ready to transform your RAG system from curated knowledge to comprehensive domain expertise!** 🚀

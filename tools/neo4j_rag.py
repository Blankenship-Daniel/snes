#!/usr/bin/env python3
"""
Neo4j RAG (Retrieval-Augmented Generation) Pipeline

This module provides context retrieval from the Neo4j knowledge graph
for use in Claude Code hooks and other AI applications.

It analyzes user queries and retrieves relevant:
- Mods and their effects
- SNES hardware registers
- Components and their relationships
- Domain knowledge
- Project information

Enhanced with MCP server integration for:
- Assembly instruction auto-lookup
- Memory region awareness
- Cross-repository code discovery
"""

import os
import re
from typing import List, Dict, Optional, Set
from neo4j import GraphDatabase
from neo4j.exceptions import Neo4jError

# Try to import MCP client for enrichments
try:
    from mcp_client import snes_lookup_instruction, snes_memory_map
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False


class SNESRAGPipeline:
    """RAG pipeline for SNES knowledge graph"""

    def __init__(self, uri: str = None, user: str = None, password: str = None):
        """Initialize with Neo4j connection"""
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = user or os.getenv("NEO4J_USER", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD")

        self.driver = None
        if self.password:
            try:
                self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
                self.driver.verify_connectivity()
            except Exception:
                # Silently fail if Neo4j is not available
                self.driver = None

    def close(self):
        """Close Neo4j connection"""
        if self.driver:
            self.driver.close()

    def is_available(self) -> bool:
        """Check if Neo4j is available"""
        return self.driver is not None

    def extract_keywords(self, text: str) -> Set[str]:
        """Extract relevant keywords from user query"""
        keywords = set()

        # Convert to lowercase for matching
        text_lower = text.lower()

        # Known mod names
        mod_keywords = [
            "infinite-magic", "infinite magic", "magic",
            "2x-speed", "2x speed", "double speed", "speed",
            "max-hearts", "max hearts", "health", "hearts",
            "intro-skip", "intro skip",
            "quick-start", "quick start",
            "team-solution", "ultimate"
        ]

        # SNES hardware terms
        hardware_keywords = [
            "ppu", "cpu", "dma", "hdma", "apu", "spc700",
            "register", "registers", "$2100", "$4200",
            "vblank", "hblank", "sprite", "oam",
            "bgmode", "background", "tilemap"
        ]

        # Component names
        component_keywords = [
            "player", "sprite", "ancilla", "dungeon",
            "overworld", "hud", "audio", "music",
            "ending", "attract", "menu"
        ]

        # Project names
        project_keywords = [
            "zelda3", "zelda 3", "link to the past", "alttp",
            "bsnes", "snes9x", "emulator",
            "disassembly", "decompilation"
        ]

        # Memory terms
        memory_keywords = [
            "wram", "sram", "rom", "memory", "bank",
            "address", "pointer"
        ]

        # Check for keywords
        all_keywords = (
            mod_keywords + hardware_keywords + component_keywords +
            project_keywords + memory_keywords
        )

        for keyword in all_keywords:
            if keyword in text_lower:
                # Normalize keyword
                keywords.add(keyword.replace(" ", "-").replace("$", ""))

        return keywords

    def get_relevant_mods(self, keywords: Set[str]) -> List[Dict]:
        """Get mods relevant to the query"""
        if not self.driver:
            return []

        with self.driver.session() as session:
            # Build query based on keywords
            mod_types = []
            if any(k in keywords for k in ["magic", "infinite-magic"]):
                mod_types.append("magic")
            if any(k in keywords for k in ["speed", "2x-speed", "double-speed"]):
                mod_types.append("speed")
            if any(k in keywords for k in ["health", "hearts", "max-hearts"]):
                mod_types.append("health")

            if mod_types:
                result = session.run("""
                    MATCH (m:Mod)
                    WHERE m.type IN $types
                    OPTIONAL MATCH (m)-[r:MODIFIES]->(c:Component)
                    RETURN m.name as name, m.description as description,
                           m.type as type, m.affected_bytes as bytes,
                           collect(c.name) as components
                """, types=mod_types)
            else:
                result = session.run("""
                    MATCH (m:Mod)
                    OPTIONAL MATCH (m)-[r:MODIFIES]->(c:Component)
                    RETURN m.name as name, m.description as description,
                           m.type as type, m.affected_bytes as bytes,
                           collect(c.name) as components
                    LIMIT 3
                """)

            return [dict(record) for record in result]

    def get_relevant_registers(self, keywords: Set[str]) -> List[Dict]:
        """Get SNES registers relevant to the query"""
        if not self.driver:
            return []

        with self.driver.session() as session:
            # Determine category
            category = None
            if any(k in keywords for k in ["ppu", "sprite", "background", "bgmode"]):
                category = "ppu"
            elif any(k in keywords for k in ["cpu", "interrupt", "nmi", "irq"]):
                category = "cpu"
            elif any(k in keywords for k in ["dma", "hdma"]):
                category = "dma"

            if category:
                result = session.run("""
                    MATCH (r:Register {category: $category})
                    RETURN r.address as address, r.name as name,
                           r.description as description, r.category as category
                    ORDER BY r.address
                    LIMIT 5
                """, category=category)
            else:
                result = session.run("""
                    MATCH (r:Register)
                    RETURN r.address as address, r.name as name,
                           r.description as description, r.category as category
                    ORDER BY r.address
                    LIMIT 5
                """)

            return [dict(record) for record in result]

    def get_relevant_components(self, keywords: Set[str]) -> List[Dict]:
        """Get components relevant to the query"""
        if not self.driver:
            return []

        with self.driver.session() as session:
            # Check for specific component names
            component_names = []
            if "player" in keywords:
                component_names.append("player")
            if any(k in keywords for k in ["sprite", "sprite_system"]):
                component_names.append("sprite_system")
            if any(k in keywords for k in ["dungeon", "dungeon_system"]):
                component_names.append("dungeon_system")

            if component_names:
                result = session.run("""
                    MATCH (c:Component)
                    WHERE c.name IN $names
                    RETURN c.name as name, c.type as type,
                           c.description as description, c.file_path as file
                """, names=component_names)
            else:
                result = session.run("""
                    MATCH (c:Component)
                    RETURN c.name as name, c.type as type,
                           c.description as description, c.file_path as file
                    LIMIT 3
                """)

            return [dict(record) for record in result]

    def get_relevant_knowledge(self, keywords: Set[str]) -> List[Dict]:
        """Get knowledge items relevant to the query"""
        if not self.driver:
            return []

        with self.driver.session() as session:
            # Search knowledge by tags and content
            result = session.run("""
                MATCH (k:Knowledge)
                WHERE ANY(tag IN k.tags WHERE tag IN $keywords)
                   OR ANY(keyword IN $keywords WHERE k.topic CONTAINS keyword
                                                  OR k.content CONTAINS keyword)
                RETURN k.topic as topic, k.content as content,
                       k.type as type, k.tags as tags
                LIMIT 3
            """, keywords=list(keywords))

            return [dict(record) for record in result]

    def get_memory_regions(self) -> List[Dict]:
        """Get SNES memory map"""
        if not self.driver:
            return []

        with self.driver.session() as session:
            result = session.run("""
                MATCH (m:MemoryRegion)
                RETURN m.name as name, m.start_addr as start,
                       m.end_addr as end, m.type as type,
                       m.description as description
                ORDER BY m.start_addr
            """)

            return [dict(record) for record in result]

    def detect_and_explain_instructions(self, user_prompt: str) -> List[Dict]:
        """
        Auto-detect 65816 assembly instructions and provide reference info.

        Args:
            user_prompt: User's query text

        Returns:
            List of instruction reference dictionaries
        """
        if not MCP_AVAILABLE:
            return []

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

        # Get unique instructions (limit to 5 to avoid clutter)
        unique_instructions = list(set(instructions))[:5]

        instruction_help = []
        for instr in unique_instructions:
            # Use MCP client to lookup instruction
            help_info = snes_lookup_instruction(mnemonic=instr)
            if help_info:
                instruction_help.append(help_info)

        return instruction_help

    def detect_and_explain_addresses(self, user_prompt: str) -> List[Dict]:
        """
        Detect SNES memory addresses and explain what they are.

        Args:
            user_prompt: User's query text

        Returns:
            List of address information dictionaries
        """
        if not MCP_AVAILABLE:
            return []

        # Detect SNES addresses in $xxxx or $xxxxxx format
        address_pattern = r'\$([0-9A-Fa-f]{4,6})\b'
        addresses = re.findall(address_pattern, user_prompt)

        if not addresses:
            return []

        # Get unique addresses (limit to 10)
        unique_addresses = list(set(addresses))[:10]

        address_info = []
        for addr in unique_addresses:
            # Use MCP client to lookup memory region
            info = snes_memory_map(address=f'${addr}')
            if info:
                address_info.append(info)

        return address_info

    def calculate_relevance_score(self, item: Dict, query: str, keywords: Set[str]) -> float:
        """
        Calculate relevance score for a retrieved item.

        Uses multiple factors:
        - Keyword match count
        - Keyword position (earlier = better)
        - Content length relevance
        - Type relevance to query
        """
        score = 0.0
        query_lower = query.lower()

        # Get searchable text from item
        searchable_text = ""
        if 'name' in item:
            searchable_text += item['name'].lower() + " "
        if 'description' in item:
            searchable_text += item['description'].lower() + " "
        if 'topic' in item:
            searchable_text += item['topic'].lower() + " "
        if 'content' in item:
            searchable_text += item['content'].lower() + " "

        # Factor 1: Keyword matches (0-10 points)
        matches = sum(1 for kw in keywords if kw in searchable_text)
        score += min(matches * 2, 10)

        # Factor 2: Exact query substring match (0-5 points)
        if query_lower in searchable_text:
            score += 5

        # Factor 3: Keyword position (earlier = better, 0-3 points)
        for kw in keywords:
            if kw in searchable_text:
                position = searchable_text.find(kw)
                if position < 50:  # In first 50 chars
                    score += 3
                    break
                elif position < 100:  # In first 100 chars
                    score += 2
                    break

        # Factor 4: Content richness (0-2 points)
        if len(searchable_text) > 100:
            score += 2
        elif len(searchable_text) > 50:
            score += 1

        return score

    def rerank_results(self, all_items: List[Dict], query: str, keywords: Set[str], max_items: int = 10) -> List[Dict]:
        """
        Rerank all retrieved items by relevance score.

        Uses a simple scoring algorithm based on keyword matching,
        position, and content relevance.
        """
        # Calculate scores for all items
        scored_items = []
        for item in all_items:
            score = self.calculate_relevance_score(item, query, keywords)
            if score > 0:  # Only include items with some relevance
                scored_items.append((score, item))

        # Sort by score (highest first) and return top N
        scored_items.sort(key=lambda x: x[0], reverse=True)
        return [item for score, item in scored_items[:max_items]]

    def build_context(self, query: str, max_items: int = 10) -> str:
        """
        Build RAG context from the knowledge graph based on the query.

        Enhanced with:
        - Relevance scoring for all retrieved items
        - Reranking to prioritize most relevant content
        - Better deduplication

        Args:
            query: User's query/prompt
            max_items: Maximum number of items to include

        Returns:
            Formatted context string to inject into the prompt
        """
        if not self.is_available():
            return ""

        # Extract keywords
        keywords = self.extract_keywords(query)

        if not keywords:
            # No relevant keywords, return empty
            return ""

        # Get relevant information (cast to wider net)
        all_items = []

        mods = self.get_relevant_mods(keywords)
        for mod in mods:
            mod['_type'] = 'mod'
            all_items.append(mod)

        registers = self.get_relevant_registers(keywords)
        for reg in registers:
            reg['_type'] = 'register'
            all_items.append(reg)

        components = self.get_relevant_components(keywords)
        for comp in components:
            comp['_type'] = 'component'
            all_items.append(comp)

        knowledge = self.get_relevant_knowledge(keywords)
        for k in knowledge:
            k['_type'] = 'knowledge'
            all_items.append(k)

        if not all_items:
            return ""

        # Rerank by relevance
        ranked_items = self.rerank_results(all_items, query, keywords, max_items)

        if not ranked_items:
            return ""

        # Group reranked items by type
        mods = [item for item in ranked_items if item['_type'] == 'mod']
        registers = [item for item in ranked_items if item['_type'] == 'register']
        components = [item for item in ranked_items if item['_type'] == 'component']
        knowledge = [item for item in ranked_items if item['_type'] == 'knowledge']

        context_parts = []

        # Format mods
        if mods:
            context_parts.append("🎮 **Relevant Mods:**")
            for mod in mods[:3]:
                components_str = ", ".join(mod['components']) if mod['components'] else "N/A"
                context_parts.append(
                    f"  - **{mod['name']}** ({mod['type']}): {mod['description']}\n"
                    f"    Affects: {components_str} | Bytes changed: {mod['bytes']}"
                )

        # Format registers
        if registers:
            context_parts.append("\n🔧 **Relevant SNES Registers:**")
            for reg in registers[:5]:
                context_parts.append(
                    f"  - **{reg['address']} ({reg['name']})**: {reg['description']}"
                )

        # Format components
        if components:
            context_parts.append("\n📦 **Relevant Components:**")
            for comp in components[:3]:
                context_parts.append(
                    f"  - **{comp['name']}** ({comp['type']}): {comp['description']}"
                )

        # Format knowledge
        if knowledge:
            context_parts.append("\n📚 **Domain Knowledge:**")
            for k in knowledge[:2]:
                # Truncate long content
                content = k['content'][:200] + "..." if len(k['content']) > 200 else k['content']
                context_parts.append(f"  - **{k['topic']}**: {content}")

        # === NEW MCP ENRICHMENTS ===

        # Add instruction help (if assembly instructions detected)
        if MCP_AVAILABLE:
            instruction_help = self.detect_and_explain_instructions(query)
            if instruction_help:
                context_parts.append("\n🔧 **Detected 65816 Instructions:**")
                for instr in instruction_help:
                    context_parts.append(f"\n**{instr['mnemonic']}**: {instr['description']}")
                    context_parts.append(f"  - Modes: {instr['modes']}")
                    context_parts.append(f"  - Cycles: {instr['cycles']}")
                    context_parts.append(f"  - Flags: {instr['flags']}")
                    if instr.get('notes'):
                        context_parts.append(f"  - Notes: {instr['notes']}")

            # Add memory region awareness (if addresses detected)
            address_info = self.detect_and_explain_addresses(query)
            if address_info:
                context_parts.append("\n📍 **Memory Addresses Referenced:**")
                for addr in address_info:
                    if 'name' in addr and addr['name']:
                        # Hardware register
                        context_parts.append(f"\n**{addr['address']}** - {addr['name']}")
                        context_parts.append(f"  {addr['description']}")
                        context_parts.append(f"  Type: {addr['type']}, Access: {addr['access']}")
                    else:
                        # Memory region
                        context_parts.append(f"\n**{addr['address']}** - {addr['region']}")
                        context_parts.append(f"  {addr['description']}")
                        context_parts.append(f"  Type: {addr['type']}, Access: {addr['access']}")

        if not context_parts:
            return ""

        # Build final context
        header = "🧠 **Enhanced Knowledge Context** (Neo4j + MCP Servers):"

        # Count enrichments
        enrichment_count = len(ranked_items)
        if MCP_AVAILABLE:
            instruction_count = len(self.detect_and_explain_instructions(query))
            address_count = len(self.detect_and_explain_addresses(query))
            if instruction_count > 0 or address_count > 0:
                footer = f"\n_Retrieved {enrichment_count} items from Neo4j + {instruction_count + address_count} MCP enrichments_"
            else:
                footer = f"\n_Retrieved and reranked {enrichment_count} most relevant items from knowledge graph_"
        else:
            footer = f"\n_Retrieved and reranked {enrichment_count} most relevant items from knowledge graph_"

        return "\n".join([header] + context_parts + [footer])

    def get_mod_context(self, mod_name: str) -> Dict:
        """Get complete context for a specific mod"""
        if not self.driver:
            return {}

        with self.driver.session() as session:
            result = session.run("""
                MATCH (m:Mod {name: $mod_name})-[:TARGETS]->(p:Project)
                OPTIONAL MATCH (m)-[r:MODIFIES]->(c:Component)
                RETURN m.name as name, m.description as description,
                       m.type as type, m.affected_bytes as bytes,
                       p.name as project,
                       collect({component: c.name, change: r.description}) as changes
            """, mod_name=mod_name)

            record = result.single()
            return dict(record) if record else {}

    def search_knowledge_graph(self, query: str) -> List[Dict]:
        """
        General purpose search across the knowledge graph.

        Returns all relevant nodes and relationships.
        """
        if not self.driver:
            return []

        keywords = self.extract_keywords(query)

        results = {
            'mods': self.get_relevant_mods(keywords),
            'registers': self.get_relevant_registers(keywords),
            'components': self.get_relevant_components(keywords),
            'knowledge': self.get_relevant_knowledge(keywords)
        }

        return results


def get_rag_context(query: str) -> Optional[str]:
    """
    Convenience function to get RAG context for a query.

    This is the main entry point for Claude Code hooks.

    Args:
        query: User's query/prompt

    Returns:
        Formatted context string or None if Neo4j unavailable
    """
    try:
        rag = SNESRAGPipeline()
        if not rag.is_available():
            return None

        context = rag.build_context(query)
        rag.close()
        return context if context else None

    except Exception as e:
        # Silently fail - don't break the hook
        return None


# Example usage
if __name__ == "__main__":
    import sys

    # Test the RAG pipeline
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    else:
        query = "How do I modify the magic system?"

    print(f"Query: {query}\n")

    rag = SNESRAGPipeline()

    if not rag.is_available():
        print("❌ Neo4j is not available")
        print("   Make sure Neo4j is running: ./tools/neo4j-docker.sh start")
        sys.exit(1)

    context = rag.build_context(query)

    if context:
        print(context)
    else:
        print("No relevant context found")

    rag.close()

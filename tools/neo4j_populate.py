#!/usr/bin/env python3
"""
Neo4j Knowledge Graph Population Script for SNES Project

This script populates a Neo4j graph database with the complete structure of the
SNES modding repository, including:
- Projects (zelda3, zelda3-disasm, bsnes-plus, snes9x)
- Components (source files and game systems)
- Mods (infinite-magic, 2x-speed, etc.)
- SNES hardware knowledge (registers, memory regions)
- Relationships between all entities

Usage:
    python tools/neo4j_populate.py --uri neo4j+s://xxx.databases.neo4j.io --user neo4j --password xxx

    Or set environment variables:
    export NEO4J_URI="neo4j+s://xxx.databases.neo4j.io"
    export NEO4J_USER="neo4j"
    export NEO4J_PASSWORD="xxx"
    python tools/neo4j_populate.py
"""

import argparse
import os
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from neo4j import GraphDatabase
from neo4j.exceptions import Neo4jError


class SNESKnowledgeGraph:
    """Manages the SNES project knowledge graph in Neo4j"""

    def __init__(self, uri: str, user: str, password: str):
        """Initialize Neo4j connection"""
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        try:
            self.driver.verify_connectivity()
            print(f"✅ Connected to Neo4j at {uri}")
        except Exception as e:
            print(f"❌ Failed to connect to Neo4j: {e}")
            raise

    def close(self):
        """Close the Neo4j connection"""
        self.driver.close()
        print("✅ Neo4j connection closed")

    def clear_database(self):
        """Clear all nodes and relationships (use with caution!)"""
        with self.driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
            print("✅ Database cleared")

    def create_schema(self):
        """Create indexes and constraints for the schema"""
        print("\n📐 Creating schema constraints and indexes...")

        constraints = [
            # Unique constraints
            "CREATE CONSTRAINT project_name IF NOT EXISTS FOR (p:Project) REQUIRE p.name IS UNIQUE",
            "CREATE CONSTRAINT component_id IF NOT EXISTS FOR (c:Component) REQUIRE c.id IS UNIQUE",
            "CREATE CONSTRAINT function_id IF NOT EXISTS FOR (f:Function) REQUIRE f.id IS UNIQUE",
            "CREATE CONSTRAINT register_addr IF NOT EXISTS FOR (r:Register) REQUIRE r.address IS UNIQUE",
            "CREATE CONSTRAINT mod_id IF NOT EXISTS FOR (m:Mod) REQUIRE m.id IS UNIQUE",
            "CREATE CONSTRAINT memory_id IF NOT EXISTS FOR (mem:MemoryRegion) REQUIRE mem.id IS UNIQUE",

            # Indexes for common queries
            "CREATE INDEX component_type IF NOT EXISTS FOR (c:Component) ON (c.type)",
            "CREATE INDEX register_category IF NOT EXISTS FOR (r:Register) ON (r.category)",
            "CREATE INDEX mod_type IF NOT EXISTS FOR (m:Mod) ON (m.type)",
        ]

        with self.driver.session() as session:
            for constraint in constraints:
                try:
                    session.run(constraint)
                except Exception as e:
                    # Constraint may already exist
                    pass

        print("✅ Schema created")

    def add_project(self, name: str, description: str, repo_path: str,
                   project_type: str, language: Optional[str] = None):
        """Add a project node"""
        with self.driver.session() as session:
            session.run("""
                MERGE (p:Project {name: $name})
                SET p.description = $description,
                    p.repo_path = $repo_path,
                    p.type = $type,
                    p.language = $language,
                    p.last_updated = datetime()
            """, name=name, description=description, repo_path=repo_path,
                type=project_type, language=language)

        print(f"  ✓ Project: {name}")

    def add_component(self, project_name: str, component_name: str,
                     component_type: str, file_path: str, description: str = ""):
        """Add a component (source file or game system)"""
        component_id = f"{project_name}:{component_name}"

        with self.driver.session() as session:
            session.run("""
                MATCH (p:Project {name: $project_name})
                MERGE (c:Component {id: $id})
                SET c.name = $name,
                    c.type = $type,
                    c.file_path = $file_path,
                    c.description = $description,
                    c.project = $project_name
                MERGE (c)-[:PART_OF]->(p)
            """, project_name=project_name, id=component_id, name=component_name,
                type=component_type, file_path=file_path, description=description)

    def add_function(self, component_id: str, function_name: str,
                    file_path: str, line_number: Optional[int] = None,
                    description: str = ""):
        """Add a function node"""
        function_id = f"{component_id}:{function_name}"

        with self.driver.session() as session:
            session.run("""
                MATCH (c:Component {id: $component_id})
                MERGE (f:Function {id: $id})
                SET f.name = $name,
                    f.file_path = $file_path,
                    f.line_number = $line_number,
                    f.description = $description
                MERGE (f)-[:BELONGS_TO]->(c)
            """, component_id=component_id, id=function_id, name=function_name,
                file_path=file_path, line_number=line_number, description=description)

    def add_mod(self, mod_name: str, project_name: str, mod_type: str,
               description: str, affected_bytes: int = 0):
        """Add a ROM modification"""
        mod_id = f"{project_name}:mod:{mod_name}"

        with self.driver.session() as session:
            session.run("""
                MATCH (p:Project {name: $project_name})
                MERGE (m:Mod {id: $id})
                SET m.name = $name,
                    m.type = $type,
                    m.description = $description,
                    m.affected_bytes = $affected_bytes,
                    m.project = $project_name,
                    m.created = datetime()
                MERGE (m)-[:TARGETS]->(p)
            """, project_name=project_name, id=mod_id, name=mod_name,
                type=mod_type, description=description, affected_bytes=affected_bytes)

    def add_mod_affects_component(self, mod_id: str, component_id: str,
                                 change_description: str = ""):
        """Create relationship: Mod affects Component"""
        with self.driver.session() as session:
            session.run("""
                MATCH (m:Mod {id: $mod_id})
                MATCH (c:Component {id: $component_id})
                MERGE (m)-[r:MODIFIES]->(c)
                SET r.description = $change_description
            """, mod_id=mod_id, component_id=component_id,
                change_description=change_description)

    def add_register(self, address: str, name: str, category: str,
                    description: str, access_type: str = "RW"):
        """Add a SNES hardware register"""
        with self.driver.session() as session:
            session.run("""
                MERGE (r:Register {address: $address})
                SET r.name = $name,
                    r.category = $category,
                    r.description = $description,
                    r.access_type = $access_type
            """, address=address, name=name, category=category,
                description=description, access_type=access_type)

    def add_memory_region(self, region_name: str, start_addr: str, end_addr: str,
                         region_type: str, description: str = ""):
        """Add a SNES memory region"""
        region_id = f"mem:{region_name}"

        with self.driver.session() as session:
            session.run("""
                MERGE (m:MemoryRegion {id: $id})
                SET m.name = $name,
                    m.start_addr = $start_addr,
                    m.end_addr = $end_addr,
                    m.type = $type,
                    m.description = $description
            """, id=region_id, name=region_name, start_addr=start_addr,
                end_addr=end_addr, type=region_type, description=description)

    def add_knowledge(self, topic: str, content: str, knowledge_type: str,
                     tags: List[str] = None):
        """Add a knowledge node"""
        knowledge_id = f"knowledge:{knowledge_type}:{topic}"

        with self.driver.session() as session:
            session.run("""
                MERGE (k:Knowledge {id: $id})
                SET k.topic = $topic,
                    k.content = $content,
                    k.type = $type,
                    k.tags = $tags,
                    k.created = datetime()
            """, id=knowledge_id, topic=topic, content=content,
                type=knowledge_type, tags=tags or [])

    def link_knowledge_to_entity(self, knowledge_id: str, entity_id: str,
                                entity_type: str):
        """Link knowledge to any entity (Component, Register, etc.)"""
        with self.driver.session() as session:
            session.run(f"""
                MATCH (k:Knowledge {{id: $knowledge_id}})
                MATCH (e:{entity_type} {{id: $entity_id}})
                MERGE (k)-[:DOCUMENTS]->(e)
            """, knowledge_id=knowledge_id, entity_id=entity_id)


def populate_projects(kg: SNESKnowledgeGraph, repo_path: Path):
    """Populate all projects in the repository"""
    print("\n🎮 Populating Projects...")

    projects = [
        {
            "name": "zelda3",
            "description": "Zelda 3 C decompilation/reimplementation - playable native port",
            "repo_path": str(repo_path / "zelda3"),
            "project_type": "decompilation",
            "language": "C"
        },
        {
            "name": "zelda3-disasm",
            "description": "Zelda 3 complete 65816 assembly disassembly",
            "repo_path": str(repo_path / "zelda3-disasm"),
            "project_type": "disassembly",
            "language": "65816 Assembly"
        },
        {
            "name": "bsnes-plus",
            "description": "bsnes-plus enhanced SNES emulator with debugging features",
            "repo_path": str(repo_path / "bsnes-plus"),
            "project_type": "emulator",
            "language": "C++"
        },
        {
            "name": "snes9x",
            "description": "SNES9x portable SNES emulator",
            "repo_path": str(repo_path / "snes9x"),
            "project_type": "emulator",
            "language": "C++"
        },
        {
            "name": "snes-mcp-server",
            "description": "MCP server providing SNES hardware documentation and tools",
            "repo_path": str(repo_path / "snes-mcp-server"),
            "project_type": "tooling",
            "language": "TypeScript"
        },
    ]

    for project in projects:
        kg.add_project(**project)


def populate_zelda3_components(kg: SNESKnowledgeGraph, repo_path: Path):
    """Populate Zelda3 C project components"""
    print("\n🗂️  Populating Zelda3 Components...")

    zelda3_src = repo_path / "zelda3"

    # Core game systems with descriptions
    components = [
        ("player", "player", "Core player character logic and movement", "player.c"),
        ("sprite_system", "gameplay", "Sprite management and rendering", "sprite.c"),
        ("ancilla_system", "gameplay", "Ancilla (projectile/effect) objects", "ancilla.c"),
        ("dungeon_system", "gameplay", "Dungeon logic, rooms, and mechanics", "dungeon.c"),
        ("overworld_system", "gameplay", "Overworld map and navigation", "overworld.c"),
        ("hud_system", "ui", "Heads-up display and menus", "hud.c"),
        ("audio_system", "audio", "Sound effects and music playback", "audio.c"),
        ("config_system", "core", "Configuration and settings", "config.c"),
        ("ending_system", "gameplay", "Game ending sequences", "ending.c"),
        ("attract_mode", "ui", "Title screen and attract mode", "attract.c"),
    ]

    for name, comp_type, description, file_name in components:
        file_path = str(zelda3_src / file_name)
        kg.add_component("zelda3", name, comp_type, file_path, description)
        print(f"  ✓ Component: {name}")


def populate_mods(kg: SNESKnowledgeGraph):
    """Populate ROM modifications"""
    print("\n🎭 Populating Mods...")

    mods = [
        {
            "mod_name": "infinite-magic",
            "project_name": "zelda3",
            "mod_type": "magic",
            "description": "Never run out of magic power - magic bar never depletes",
            "affected_bytes": 7,
            "affects": [("zelda3:player", "Magic depletion disabled")]
        },
        {
            "mod_name": "max-hearts",
            "project_name": "zelda3",
            "mod_type": "health",
            "description": "Start with maximum health (20 hearts)",
            "affected_bytes": 4,
            "affects": [("zelda3:player", "Initial health set to maximum")]
        },
        {
            "mod_name": "2x-speed",
            "project_name": "zelda3",
            "mod_type": "speed",
            "description": "Move at double speed - faster gameplay",
            "affected_bytes": 26,
            "affects": [
                ("zelda3:player", "Movement speed doubled"),
                ("zelda3:overworld_system", "Overworld traversal speed increased")
            ]
        },
        {
            "mod_name": "intro-skip",
            "project_name": "zelda3",
            "mod_type": "flow",
            "description": "Skip opening cutscene instantly",
            "affected_bytes": 0,
            "affects": [("zelda3:attract_mode", "Intro cutscene bypassed")]
        },
        {
            "mod_name": "quick-start",
            "project_name": "zelda3",
            "mod_type": "equipment",
            "description": "Start with better equipment",
            "affected_bytes": 0,
            "affects": [("zelda3:player", "Initial equipment upgraded")]
        },
        {
            "mod_name": "team-solution",
            "project_name": "zelda3",
            "mod_type": "combo",
            "description": "Balanced combo: infinite magic + 2x speed + intro skip (recommended)",
            "affected_bytes": 33,
            "affects": [
                ("zelda3:player", "Magic and speed modified"),
                ("zelda3:attract_mode", "Intro skipped")
            ]
        },
        {
            "mod_name": "ultimate",
            "project_name": "zelda3",
            "mod_type": "combo",
            "description": "Everything enabled - overpowered gameplay experience",
            "affected_bytes": 0,
            "affects": [
                ("zelda3:player", "All player enhancements"),
                ("zelda3:attract_mode", "Intro skipped")
            ]
        },
    ]

    for mod in mods:
        affects = mod.pop("affects")
        kg.add_mod(**mod)

        # Create relationships to affected components
        mod_id = f"{mod['project_name']}:mod:{mod['mod_name']}"
        for component_id, change_desc in affects:
            kg.add_mod_affects_component(mod_id, component_id, change_desc)

        print(f"  ✓ Mod: {mod['mod_name']}")


def populate_snes_hardware(kg: SNESKnowledgeGraph):
    """Populate SNES hardware registers and memory regions"""
    print("\n🔧 Populating SNES Hardware Knowledge...")

    # PPU Registers
    print("  Adding PPU registers...")
    ppu_registers = [
        ("$2100", "INIDISP", "ppu", "Screen Display Register - brightness and force blank", "W"),
        ("$2101", "OBJSEL", "ppu", "Object Size and Character Size Register", "W"),
        ("$2102", "OAMADDL", "ppu", "OAM Address (low byte)", "W"),
        ("$2103", "OAMADDH", "ppu", "OAM Address (high byte)", "W"),
        ("$2105", "BGMODE", "ppu", "BG Mode and Character Size Register", "W"),
        ("$2106", "MOSAIC", "ppu", "Mosaic Register", "W"),
        ("$2107", "BG1SC", "ppu", "BG1 Screen Base and Screen Size", "W"),
        ("$2108", "BG2SC", "ppu", "BG2 Screen Base and Screen Size", "W"),
        ("$210D", "BG1HOFS", "ppu", "BG1 Horizontal Scroll", "W"),
        ("$210E", "BG1VOFS", "ppu", "BG1 Vertical Scroll", "W"),
    ]

    for register in ppu_registers:
        kg.add_register(*register)

    # CPU/System Registers
    print("  Adding CPU/System registers...")
    cpu_registers = [
        ("$4200", "NMITIMEN", "cpu", "Interrupt Enable - NMI/IRQ/Auto-joypad", "W"),
        ("$4201", "WRIO", "cpu", "IO Port Write", "W"),
        ("$4210", "RDNMI", "cpu", "NMI Flag and CPU Version", "R"),
        ("$4211", "TIMEUP", "cpu", "IRQ Flag", "R"),
        ("$4212", "HVBJOY", "cpu", "H/V Blank and Joypad Status", "R"),
    ]

    for register in cpu_registers:
        kg.add_register(*register)

    # DMA Registers
    print("  Adding DMA registers...")
    dma_registers = [
        ("$420B", "MDMAEN", "dma", "DMA Enable", "W"),
        ("$420C", "HDMAEN", "dma", "HDMA Enable", "W"),
        ("$4300", "DMAP0", "dma", "DMA Control for Channel 0", "W"),
        ("$4301", "BBAD0", "dma", "DMA Destination for Channel 0", "W"),
    ]

    for register in dma_registers:
        kg.add_register(*register)

    # Memory Regions
    print("  Adding memory regions...")
    memory_regions = [
        ("WRAM", "$7E0000", "$7FFFFF", "ram", "Work RAM - 128KB general purpose memory"),
        ("ROM_LOBANK", "$808000", "$80FFFF", "rom", "LoROM first bank mapping"),
        ("SRAM", "$700000", "$7DFFFF", "ram", "Save RAM area"),
        ("PPU_REGS", "$2100", "$213F", "registers", "PPU I/O registers"),
        ("CPU_REGS", "$4200", "$421F", "registers", "CPU I/O registers"),
        ("DMA_REGS", "$4300", "$437F", "registers", "DMA channel registers"),
    ]

    for region in memory_regions:
        kg.add_memory_region(*region)

    print("  ✓ Hardware populated")


def populate_knowledge(kg: SNESKnowledgeGraph):
    """Populate domain knowledge and context"""
    print("\n📚 Populating Domain Knowledge...")

    knowledge_items = [
        {
            "topic": "65816 Architecture",
            "content": "The 65816 is a 16-bit microprocessor that powers the SNES. "
                      "It supports both 8-bit and 16-bit modes, has 24-bit addressing, "
                      "and includes special DMA capabilities for graphics.",
            "knowledge_type": "architecture",
            "tags": ["cpu", "65816", "architecture"]
        },
        {
            "topic": "SNES PPU Overview",
            "content": "The Picture Processing Unit handles all graphics rendering. "
                      "It supports 8 background modes with different capabilities, "
                      "128 hardware sprites (OAM), and multiple special effects like "
                      "Mode 7 rotation/scaling.",
            "knowledge_type": "architecture",
            "tags": ["ppu", "graphics", "hardware"]
        },
        {
            "topic": "DMA Transfer Best Practices",
            "content": "DMA should be done during V-Blank to avoid visual artifacts. "
                      "Always set up DMA parameters before enabling. Use HDMA for "
                      "per-scanline effects like gradients or parallax scrolling.",
            "knowledge_type": "best_practice",
            "tags": ["dma", "vblank", "performance"]
        },
        {
            "topic": "Magic System Implementation",
            "content": "The magic system tracks magic points and handles depletion "
                      "when using items like the Fire Rod. The infinite-magic mod "
                      "patches the depletion routine to prevent magic from decreasing.",
            "knowledge_type": "implementation",
            "tags": ["magic", "gameplay", "zelda3"]
        },
        {
            "topic": "ROM Modding Workflow",
            "content": "This repository uses a prebuilt ROM approach for fast iteration. "
                      "Mods are applied via binary patches, validated with checksums, "
                      "and tested in emulators. The workflow achieves <30 second mod times.",
            "knowledge_type": "workflow",
            "tags": ["modding", "rom", "workflow"]
        },
    ]

    for item in knowledge_items:
        kg.add_knowledge(**item)
        print(f"  ✓ Knowledge: {item['topic']}")


def populate_function_calls(kg: SNESKnowledgeGraph, repo_path: Path):
    """Extract and populate function definitions from zelda3 C source"""
    print("\n🔍 Extracting Functions from Zelda3 Source...")

    zelda3_src = repo_path / "zelda3"

    # Simple function pattern for C files
    function_pattern = re.compile(r'^(?:void|int|uint\d+|bool)\s+(\w+)\s*\(', re.MULTILINE)

    component_files = [
        ("zelda3:player", "player.c"),
        ("zelda3:sprite_system", "sprite.c"),
        ("zelda3:ancilla_system", "ancilla.c"),
        ("zelda3:dungeon_system", "dungeon.c"),
    ]

    function_count = 0
    for component_id, file_name in component_files:
        file_path = zelda3_src / file_name
        if not file_path.exists():
            continue

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                matches = function_pattern.findall(content)

                for func_name in matches[:10]:  # Limit to first 10 functions per file
                    kg.add_function(
                        component_id=component_id,
                        function_name=func_name,
                        file_path=str(file_path),
                        description=f"Function in {file_name}"
                    )
                    function_count += 1
        except Exception as e:
            print(f"  ⚠️  Could not parse {file_name}: {e}")

    print(f"  ✓ Extracted {function_count} functions")


def print_statistics(kg: SNESKnowledgeGraph):
    """Print graph statistics"""
    print("\n📊 Knowledge Graph Statistics:")

    with kg.driver.session() as session:
        # Count nodes by type
        node_types = ["Project", "Component", "Mod", "Register", "MemoryRegion",
                     "Function", "Knowledge"]

        for node_type in node_types:
            result = session.run(f"MATCH (n:{node_type}) RETURN count(n) as count")
            count = result.single()["count"]
            print(f"  {node_type}: {count}")

        # Count relationships
        result = session.run("MATCH ()-[r]->() RETURN count(r) as count")
        rel_count = result.single()["count"]
        print(f"  Total Relationships: {rel_count}")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Populate Neo4j knowledge graph with SNES project data"
    )
    # Determine a sensible, environment-agnostic default repo path:
    # 1) REPO_PATH env var if provided
    # 2) Repo root inferred from this file location (../)
    inferred_repo_root = Path(__file__).resolve().parents[1]
    default_repo_path = os.getenv("REPO_PATH", str(inferred_repo_root))
    parser.add_argument(
        "--uri",
        default=os.getenv("NEO4J_URI", "bolt://localhost:7687"),
        help="Neo4j connection URI"
    )
    parser.add_argument(
        "--user",
        default=os.getenv("NEO4J_USER", "neo4j"),
        help="Neo4j username"
    )
    parser.add_argument(
        "--password",
        default=os.getenv("NEO4J_PASSWORD"),
        help="Neo4j password"
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear database before populating"
    )
    parser.add_argument(
        "--repo-path",
        default=default_repo_path,
        help="Path to the SNES repository"
    )

    args = parser.parse_args()

    if not args.password:
        print("❌ Neo4j password required (--password or NEO4J_PASSWORD env var)")
        return 1

    repo_path = Path(args.repo_path)
    if not repo_path.exists():
        # Fall back to inferred repo root if the provided path doesn't exist
        fallback = inferred_repo_root
        if fallback.exists():
            print(f"⚠️  Provided repo path does not exist: {repo_path}")
            print(f"   Falling back to inferred repo root: {fallback}")
            repo_path = fallback
        else:
            print(f"❌ Repository path does not exist: {repo_path}")
            return 1

    print("🚀 SNES Knowledge Graph Population")
    print("=" * 60)
    print(f"Repository: {repo_path}")
    print(f"Neo4j URI: {args.uri}")
    print("=" * 60)

    # Initialize knowledge graph
    kg = SNESKnowledgeGraph(args.uri, args.user, args.password)

    try:
        # Optionally clear database
        if args.clear:
            print("\n⚠️  Clearing database...")
            kg.clear_database()

        # Create schema
        kg.create_schema()

        # Populate all data
        populate_projects(kg, repo_path)
        populate_zelda3_components(kg, repo_path)
        populate_mods(kg)
        populate_snes_hardware(kg)
        populate_knowledge(kg)
        populate_function_calls(kg, repo_path)

        # Print statistics
        print_statistics(kg)

        print("\n" + "=" * 60)
        print("✅ Knowledge graph populated successfully!")
        print("=" * 60)
        print("\n💡 Example Queries:")
        print("  # Find all mods affecting a component:")
        print("  MATCH (m:Mod)-[:MODIFIES]->(c:Component {name: 'player'})")
        print("  RETURN m.name, m.description")
        print()
        print("  # Find all PPU registers:")
        print("  MATCH (r:Register {category: 'ppu'})")
        print("  RETURN r.address, r.name, r.description")
        print()
        print("  # Find knowledge related to magic:")
        print("  MATCH (k:Knowledge)")
        print("  WHERE 'magic' IN k.tags")
        print("  RETURN k.topic, k.content")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        kg.close()

    return 0


if __name__ == "__main__":
    exit(main())

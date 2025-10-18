#!/usr/bin/env python3
"""
Populate Neo4j with SNES ROM Reverse-Engineering Knowledge

This script adds comprehensive knowledge about SNES ROM structure,
memory mapping, header formats, and reverse-engineering techniques.

Sources:
- SNES MCP Server (memory map)
- SNESdev Wiki (ROM header documentation)
- RetroReversing.com (reverse engineering guides)
- Exa code context (ROM parsing implementations)
"""

import os
import sys
from neo4j import GraphDatabase
from typing import List, Dict

# Neo4j connection details
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "snes-graph-2024")


class ROMKnowledgePopulator:
    def __init__(self):
        self.driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    def close(self):
        self.driver.close()

    def add_rom_structure_knowledge(self):
        """Add knowledge about SNES ROM file structure."""

        knowledge_items = [
            {
                "topic": "SNES ROM Header Location",
                "content": "The ROM header is located at CPU address $00FFC0-$00FFDF, right before the interrupt vectors. Physical location in ROM file varies by mapping mode: LoROM=$7FC0, HiROM=$FFC0, ExHiROM=$40FFC0.",
                "type": "knowledge",
                "tags": ["rom", "header", "memory-mapping", "lorom", "hirom"],
                "source": "SNESdev Wiki - ROM header",
                "url": "https://snes.nesdev.org/wiki/ROM_header"
            },
            {
                "topic": "LoROM vs HiROM Memory Mapping",
                "content": "LoROM maps ROM in 32KB chunks to upper half of each bank ($8000-$FFFF) in banks $00-$7D and $80-$FF. HiROM maps 64KB blocks starting at bank $C0 address $0000, offering contiguous addressing. LoROM supports 4MB max, HiROM supports more.",
                "type": "knowledge",
                "tags": ["lorom", "hirom", "memory-mapping", "cartridge"],
                "source": "SNES MCP Server + RetroReversing",
                "url": "https://www.retroreversing.com/snes/"
            },
            {
                "topic": "ROM Header Fields ($FFD5-$FFDE)",
                "content": "$FFD5=Map Mode (LoROM/HiROM/FastROM), $FFD6=Cartridge Type (coprocessors/SRAM), $FFD7=ROM Size (2^n KB), $FFD8=SRAM Size, $FFD9=Region Code, $FFDC=Complement Check, $FFDE=Checksum. These fields identify ROM capabilities and validate integrity.",
                "type": "knowledge",
                "tags": ["rom", "header", "validation", "metadata"],
                "source": "SNESLab.net - SNES ROM Header",
                "url": "https://sneslab.net/wiki/SNES_ROM_Header"
            },
            {
                "topic": "FastROM Speed Enhancement",
                "content": "FastROM allows 3.58MHz CPU access speeds vs standard 2.68MHz in specific memory regions (banks $80-$FF). Enabled via Map Mode byte ($FFD5). Provides ~30% performance boost for code in these banks.",
                "type": "best_practice",
                "tags": ["fastrom", "performance", "cpu", "optimization"],
                "source": "RetroReversing + pvsneslib Wiki",
                "url": "https://github.com/alekmaul/pvsneslib/wiki/HiRom-and-FastRom"
            },
            {
                "topic": "SNES Interrupt Vector Table",
                "content": "Interrupt vectors at $FFE0-$FFFF define entry points: NMI (VBlank), IRQ (HBlank/Timer), BRK, COP, RESET, etc. ROM must populate these vectors for proper hardware operation. Located immediately after ROM header.",
                "type": "knowledge",
                "tags": ["vectors", "interrupts", "nmi", "irq", "hardware"],
                "source": "SNESdev Wiki - CPU vectors",
                "url": "https://snes.nesdev.org/wiki/CPU_vectors"
            },
            {
                "topic": "Copier Headers (512-byte SMC)",
                "content": "Some ROM files have an additional 512-byte copier header prepended to the actual ROM data. This header was used by backup devices and must be stripped for accurate address calculations. Not part of official SNES ROM format.",
                "type": "knowledge",
                "tags": ["rom", "header", "smc", "copier", "file-format"],
                "source": "SNESdev Wiki - ROM file formats",
                "url": "https://snes.nesdev.org/wiki/ROM_file_formats"
            },
            {
                "topic": "ROM Checksum Validation",
                "content": "Checksum at $FFDE is 16-bit sum of all ROM bytes (excluding header area). Complement check at $FFDC should equal ~checksum. Used by emulators/flashcarts to validate ROM integrity. Can be recalculated after ROM modifications.",
                "type": "implementation",
                "tags": ["checksum", "validation", "rom-hacking", "integrity"],
                "source": "SNESdev Wiki + practical experience",
                "url": "https://snes.nesdev.org/wiki/ROM_header"
            },
            {
                "topic": "WRAM Memory Region",
                "content": "128KB Work RAM occupies banks $7E-$7F. Not part of cartridge ROM but essential for game execution. Variables, stack, and temporary data stored here. Cannot be mapped to ROM in these banks.",
                "type": "knowledge",
                "tags": ["wram", "memory", "ram", "variables"],
                "source": "SNES MCP Server - memory_map",
                "url": "https://snes.nesdev.org/wiki/Memory_map"
            },
            {
                "topic": "ROM Bank Organization",
                "content": "SNES uses 24-bit addressing: 8-bit bank + 16-bit address. 256 possible banks of 64KB each. Banks $00-$3F/$80-$BF contain mirrors and I/O. Actual ROM mapped to specific banks based on LoROM/HiROM mode.",
                "type": "knowledge",
                "tags": ["banks", "addressing", "memory-map", "24-bit"],
                "source": "RetroReversing + SNES MCP",
                "url": "https://www.retroreversing.com/snes/"
            },
            {
                "topic": "MMIO Registers ($2100-$21FF)",
                "content": "Memory-Mapped I/O registers in bank $00 control PPU (graphics), APU (audio), DMA, and other hardware. Located at $2100-$21FF. Not ROM data but essential for understanding how games interact with hardware.",
                "type": "knowledge",
                "tags": ["mmio", "registers", "ppu", "apu", "dma", "hardware"],
                "source": "RetroReversing - MMIO article",
                "url": "https://www.retroreversing.com/snes/"
            },
            {
                "topic": "Reverse-Engineering ROM Files",
                "content": "To reverse-engineer SNES ROMs: 1) Identify mapping mode from header, 2) Locate interrupt vectors to find code entry points, 3) Disassemble 65816 code starting from RESET vector, 4) Map data structures and graphics, 5) Document hardware register access patterns.",
                "type": "best_practice",
                "tags": ["reverse-engineering", "methodology", "disassembly", "rom-hacking"],
                "source": "RetroReversing + community practices",
                "url": "https://www.retroreversing.com/snes/"
            },
            {
                "topic": "ExHiROM Extended Mapping",
                "content": "ExHiROM extends HiROM to support ROMs >4MB. Uses banks $C0-$FF (64KB each) plus $40-$7D (32KB each). Header at $40FFC0. Rare in commercial games but used in some late-era titles and homebrew.",
                "type": "knowledge",
                "tags": ["exhirom", "extended", "large-rom", "mapping"],
                "source": "SNESdev Wiki",
                "url": "https://snes.nesdev.org/wiki/ExHiROM"
            }
        ]

        with self.driver.session() as session:
            for item in knowledge_items:
                session.run("""
                    CREATE (k:Knowledge {
                        topic: $topic,
                        content: $content,
                        type: $type,
                        tags: $tags,
                        source: $source,
                        url: $url,
                        category: 'rom-reverse-engineering',
                        created_at: datetime(),
                        last_updated: datetime()
                    })
                """, **item)
                print(f"✅ Added: {item['topic']}")

    def add_rom_registers(self):
        """Add ROM header-related memory locations as register entries."""

        registers = [
            {
                "address": "$FFD5",
                "name": "ROM Map Mode",
                "description": "Defines memory mapping mode: bits 0-3=map mode (0=LoROM, 1=HiROM, 2=SA-1, 5=ExHiROM), bit 4=speed (0=slow 2.68MHz, 1=FastROM 3.58MHz)",
                "access": "read",
                "category": "ROM Header"
            },
            {
                "address": "$FFD6",
                "name": "Cartridge Type",
                "description": "Specifies cartridge features: ROM only, ROM+RAM, ROM+SRAM, ROM+DSP, ROM+SuperFX, ROM+SA-1, etc. Used by emulators to configure hardware emulation.",
                "access": "read",
                "category": "ROM Header"
            },
            {
                "address": "$FFD7",
                "name": "ROM Size",
                "description": "ROM size encoded as power of 2: value N means 2^N kilobytes. Example: $09 = 512KB, $0A = 1MB, $0B = 2MB, $0C = 4MB.",
                "access": "read",
                "category": "ROM Header"
            },
            {
                "address": "$FFD8",
                "name": "SRAM Size",
                "description": "SRAM size encoded as power of 2: value N means 2^N kilobytes. $00 = no SRAM. Used for battery-backed saves.",
                "access": "read",
                "category": "ROM Header"
            },
            {
                "address": "$FFD9",
                "name": "Destination Code",
                "description": "Region code: $00=Japan, $01=USA, $02=Europe, $03=Sweden/Scandinavia, $04=Finland, $05=Denmark, $06=France, $07=Netherlands, $08=Spain, $09=Germany, $0A=Italy, $0B=China, $0C=Indonesia, $0D=South Korea.",
                "access": "read",
                "category": "ROM Header"
            },
            {
                "address": "$FFDC",
                "name": "Complement Check",
                "description": "16-bit complement of checksum (should equal ~checksum). Used to validate header integrity: checksum XOR complement should equal $FFFF.",
                "access": "read",
                "category": "ROM Header"
            },
            {
                "address": "$FFDE",
                "name": "ROM Checksum",
                "description": "16-bit checksum: sum of all ROM bytes modulo 65536. Emulators/flashcarts use this to validate ROM integrity. Can be recalculated after modifications.",
                "access": "read",
                "category": "ROM Header"
            },
            {
                "address": "$FFFC",
                "name": "RESET Vector",
                "description": "16-bit address where CPU starts execution on power-on/reset. Points to game initialization code. Critical entry point for reverse engineering.",
                "access": "read",
                "category": "Interrupt Vectors"
            },
            {
                "address": "$FFEA",
                "name": "NMI Vector",
                "description": "16-bit address for Non-Maskable Interrupt handler (VBlank). Called ~60 times/sec. Critical for graphics updates and game timing.",
                "access": "read",
                "category": "Interrupt Vectors"
            },
            {
                "address": "$FFEE",
                "name": "IRQ Vector",
                "description": "16-bit address for Interrupt Request handler (HBlank/Timer). Used for raster effects and timing. Optional depending on game needs.",
                "access": "read",
                "category": "Interrupt Vectors"
            }
        ]

        with self.driver.session() as session:
            for reg in registers:
                session.run("""
                    MERGE (r:Register {address: $address})
                    SET r.name = $name,
                        r.description = $description,
                        r.access = $access,
                        r.category = $category,
                        r.last_updated = datetime()
                """, **reg)
                print(f"✅ Added register: {reg['address']} ({reg['name']})")

    def add_memory_regions(self):
        """Add ROM-related memory regions."""

        regions = [
            {
                "name": "LoROM Bank 0 ROM",
                "start_addr": "$008000",
                "end_addr": "$00FFFF",
                "type": "ROM",
                "description": "First 32KB of ROM in LoROM mapping. Banks $00-$7D map ROM at $8000-$FFFF (32KB chunks). Mirrored in banks $80-$FF for FastROM access."
            },
            {
                "name": "HiROM Bank C0 ROM",
                "start_addr": "$C00000",
                "end_addr": "$FFFFFF",
                "type": "ROM",
                "description": "HiROM mapping: full 64KB banks from $C0-$FF. Allows up to 4MB contiguous ROM access. More complex banking but simpler addressing."
            },
            {
                "name": "ROM Header Area",
                "start_addr": "$00FFC0",
                "end_addr": "$00FFDF",
                "type": "ROM",
                "description": "Internal ROM header containing game metadata, mapping mode, ROM/SRAM sizes, region code, and checksums. Required by emulators but not SNES hardware."
            },
            {
                "name": "Interrupt Vectors",
                "start_addr": "$00FFE0",
                "end_addr": "$00FFFF",
                "type": "ROM",
                "description": "16-bit vectors for CPU interrupts: COP, BRK, ABORT, NMI, RESET, IRQ. Hardware reads these to determine interrupt handler addresses."
            }
        ]

        with self.driver.session() as session:
            for region in regions:
                session.run("""
                    CREATE (m:MemoryRegion {
                        name: $name,
                        start_addr: $start_addr,
                        end_addr: $end_addr,
                        type: $type,
                        description: $description,
                        created_at: datetime()
                    })
                """, **region)
                print(f"✅ Added memory region: {region['name']}")

    def link_knowledge_to_entities(self):
        """Create relationships between knowledge nodes and related entities."""

        with self.driver.session() as session:
            # Link ROM knowledge to memory regions
            session.run("""
                MATCH (k:Knowledge)
                WHERE k.category = 'rom-reverse-engineering'
                  AND any(tag IN k.tags WHERE tag IN ['lorom', 'hirom', 'memory-mapping'])
                MATCH (m:MemoryRegion)
                WHERE m.type = 'ROM'
                MERGE (k)-[:RELATES_TO]->(m)
            """)
            print("✅ Linked ROM knowledge to memory regions")

            # Link ROM knowledge to header registers
            session.run("""
                MATCH (k:Knowledge)
                WHERE k.category = 'rom-reverse-engineering'
                  AND any(tag IN k.tags WHERE tag IN ['header', 'validation', 'checksum'])
                MATCH (r:Register)
                WHERE r.category = 'ROM Header'
                MERGE (k)-[:RELATES_TO]->(r)
            """)
            print("✅ Linked ROM knowledge to header registers")

            # Link ROM knowledge to interrupt vector registers
            session.run("""
                MATCH (k:Knowledge)
                WHERE any(tag IN k.tags WHERE tag IN ['vectors', 'interrupts'])
                MATCH (r:Register)
                WHERE r.category = 'Interrupt Vectors'
                MERGE (k)-[:RELATES_TO]->(r)
            """)
            print("✅ Linked ROM knowledge to interrupt vectors")

    def run(self):
        """Execute all population steps."""
        print("=" * 60)
        print("Populating Neo4j with ROM Reverse-Engineering Knowledge")
        print("=" * 60)

        try:
            print("\n📚 Adding ROM structure knowledge...")
            self.add_rom_structure_knowledge()

            print("\n🔧 Adding ROM header registers...")
            self.add_rom_registers()

            print("\n📍 Adding memory regions...")
            self.add_memory_regions()

            print("\n🔗 Creating relationships...")
            self.link_knowledge_to_entities()

            print("\n" + "=" * 60)
            print("✅ Successfully populated ROM reverse-engineering knowledge!")
            print("=" * 60)

        except Exception as e:
            print(f"\n❌ Error: {e}")
            raise
        finally:
            self.close()


if __name__ == "__main__":
    populator = ROMKnowledgePopulator()
    populator.run()

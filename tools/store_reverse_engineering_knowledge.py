#!/usr/bin/env python3
"""
Store SNES Reverse Engineering Best Practices in Neo4j

This script parses the comprehensive best practices document and
creates a structured knowledge graph in Neo4j with:
- Tools (emulators, disassemblers, editors)
- Methodologies (workflows, patterns)
- Technical Patterns (65816 assembly, DMA, memory)
- Resources (documentation, communities)
- Best Practices

Relationships connect these for effective RAG retrieval.
"""

import os
from typing import Dict, List
from neo4j import GraphDatabase
from neo4j.exceptions import Neo4jError


class ReverseEngineeringKnowledgeLoader:
    """Loads SNES reverse engineering best practices into Neo4j"""

    def __init__(self, uri: str = None, user: str = None, password: str = None):
        """Initialize with Neo4j connection"""
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = user or os.getenv("NEO4J_USER", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD")

        if not self.password:
            raise ValueError("NEO4J_PASSWORD environment variable required")

        self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
        self.driver.verify_connectivity()
        print(f"✓ Connected to Neo4j at {self.uri}")

    def close(self):
        """Close Neo4j connection"""
        if self.driver:
            self.driver.close()

    def clear_existing_knowledge(self):
        """Clear existing reverse engineering knowledge (optional)"""
        with self.driver.session() as session:
            # Remove only reverse engineering related nodes
            session.run("""
                MATCH (n)
                WHERE n:Tool OR n:Methodology OR n:TechnicalPattern OR
                      n:Resource OR n:BestPractice OR n:Workflow
                DETACH DELETE n
            """)
            print("✓ Cleared existing reverse engineering knowledge")

    def create_tools(self):
        """Create Tool nodes"""
        tools = [
            # Emulators
            {
                'name': 'bsnes-plus',
                'category': 'emulator',
                'type': 'debugging',
                'description': 'Most accurate SNES emulator with comprehensive debugging tools',
                'features': ['CPU/SMP/SA-1 debugger', 'memory editor', 'breakpoints', 'trace logging'],
                'strengths': 'Hardware-accurate, comprehensive debugging',
                'use_cases': ['hardware-accurate debugging', 'timing analysis', 'coprocessor debugging'],
                'profiles': ['accuracy', 'compatibility', 'performance'],
                'recommended': True,
                'tags': ['emulator', 'debugger', 'accuracy', 'bsnes']
            },
            {
                'name': 'Snes9x',
                'category': 'emulator',
                'type': 'debugging',
                'description': 'Lightweight SNES emulator with basic debugging features',
                'features': ['basic debugging', 'memory search', 'cheat codes'],
                'strengths': 'Lightweight, faster than bsnes-plus',
                'use_cases': ['quick testing', 'memory watching', 'initial exploration'],
                'recommended': False,
                'tags': ['emulator', 'debugger', 'lightweight', 'snes9x']
            },
            # Disassemblers
            {
                'name': 'DiztinGUIsh',
                'category': 'disassembler',
                'type': 'gui',
                'description': 'SNES ROM disassembler with GUI and automatic code/data separation',
                'features': ['automatic code/data separation', 'label generation', 'visual disassembly'],
                'use_cases': ['initial disassembly', 'visual analysis', 'project export'],
                'recommended': True,
                'tags': ['disassembler', 'gui', 'automation']
            },
            {
                'name': 'snes2asm',
                'category': 'disassembler',
                'type': 'cli',
                'description': 'Python-based disassembler with asset extraction',
                'features': ['graphics extraction', 'audio extraction', 'text extraction', 'YAML configuration'],
                'use_cases': ['automated disassembly', 'asset extraction', 'buildable projects'],
                'recommended': True,
                'tags': ['disassembler', 'python', 'extraction', 'automation']
            },
            {
                'name': 'ca65',
                'category': 'assembler',
                'type': 'toolchain',
                'description': 'Industry-standard 65816 assembler with powerful linking',
                'features': ['multi-bank support', 'linking scripts', 'macro support'],
                'use_cases': ['building disassembled projects', 'new development'],
                'recommended': True,
                'tags': ['assembler', '65816', 'toolchain']
            },
            {
                'name': 'WLA DX',
                'category': 'assembler',
                'type': 'toolchain',
                'description': 'Alternative 65816 assembler with wide community support',
                'use_cases': ['reassembling disassembled ROMs'],
                'recommended': True,
                'tags': ['assembler', '65816', 'community']
            },
            # Analysis Tools
            {
                'name': 'YY-CHR',
                'category': 'graphics',
                'type': 'viewer',
                'description': 'Graphics tile viewer/editor for SNES',
                'features': ['1/2/4bpp support', 'palette editing', 'tile editing'],
                'use_cases': ['graphics analysis', 'tile viewing', 'palette editing'],
                'recommended': True,
                'tags': ['graphics', 'tiles', 'palette', 'editor']
            },
            {
                'name': 'HxD',
                'category': 'editor',
                'type': 'hex',
                'description': 'Hex editor for low-level ROM inspection',
                'features': ['search/replace', 'pattern finding', 'binary diff'],
                'use_cases': ['direct binary editing', 'text replacement', 'pattern search'],
                'recommended': True,
                'tags': ['hex', 'editor', 'binary']
            },
            {
                'name': 'Ghidra',
                'category': 'disassembler',
                'type': 'advanced',
                'description': "NSA's reverse engineering suite with 65816 plugin support",
                'features': ['decompilation', 'cross-references', 'function analysis'],
                'use_cases': ['complex code analysis', 'algorithm understanding'],
                'recommended': False,
                'tags': ['disassembler', 'decompiler', 'advanced']
            }
        ]

        with self.driver.session() as session:
            for tool in tools:
                # Extract only the fields we want to store
                params = {
                    'name': tool['name'],
                    'category': tool['category'],
                    'type': tool['type'],
                    'description': tool['description'],
                    'features': tool.get('features', []),
                    'use_cases': tool.get('use_cases', []),
                    'recommended': tool.get('recommended', False),
                    'tags': tool.get('tags', [])
                }

                session.run("""
                    MERGE (t:Tool {name: $name})
                    SET t.category = $category,
                        t.type = $type,
                        t.description = $description,
                        t.features = $features,
                        t.use_cases = $use_cases,
                        t.recommended = $recommended,
                        t.tags = $tags
                """, **params)

        print(f"✓ Created {len(tools)} Tool nodes")

    def create_methodologies(self):
        """Create Methodology nodes"""
        methodologies = [
            {
                'name': 'Iterative Discovery',
                'type': 'workflow',
                'description': 'Systematic approach to ROM reverse engineering through iterative phases',
                'phases': ['initial exploration', 'memory mapping', 'code analysis', 'disassembly'],
                'duration': '200+ hours for full workflow',
                'difficulty': 'intermediate',
                'tags': ['workflow', 'systematic', 'iterative']
            },
            {
                'name': 'Breakpoint-First Approach',
                'type': 'debugging',
                'description': 'Use breakpoints to trace code execution from observed behavior',
                'steps': [
                    'Identify target behavior',
                    'Find related RAM addresses',
                    'Set write breakpoint',
                    'Trigger behavior',
                    'Examine call stack',
                    'Trace backwards',
                    'Document code path'
                ],
                'difficulty': 'beginner',
                'recommended': True,
                'tags': ['debugging', 'breakpoints', 'tracing']
            },
            {
                'name': 'Comparison Method',
                'type': 'analysis',
                'description': 'Find code differences by comparing save states',
                'steps': [
                    'Create two save states',
                    'Dump WRAM from both',
                    'Use binary diff',
                    'Identify changed addresses',
                    'Set breakpoints',
                    'Analyze code'
                ],
                'use_cases': ['finding code differences', 'understanding patches'],
                'tags': ['analysis', 'comparison', 'save states']
            },
            {
                'name': 'RAM Search Workflow',
                'type': 'memory',
                'description': 'Systematic approach to finding unknown memory addresses',
                'approaches': ['unknown initial value', 'known value search'],
                'data_types': ['8-bit', '16-bit', 'BCD', 'bit flags'],
                'tags': ['memory', 'search', 'wram']
            },
            {
                'name': 'Automated Disassembly',
                'type': 'disassembly',
                'description': 'Use tools for fast initial disassembly',
                'pros': ['fast initial pass', 'handles bank switching', 'exports buildable projects'],
                'cons': ['requires manual cleanup', 'may misidentify code/data', 'generic labels'],
                'tools_used': ['DiztinGUIsh', 'snes2asm'],
                'tags': ['disassembly', 'automation', 'tools']
            },
            {
                'name': 'Manual Disassembly',
                'type': 'disassembly',
                'description': 'Hand-crafted disassembly for perfect accuracy',
                'pros': ['deep understanding', 'perfect code/data separation', 'meaningful labels'],
                'cons': ['extremely time-consuming', 'easy to make mistakes', 'requires expertise'],
                'tags': ['disassembly', 'manual', 'expert']
            }
        ]

        with self.driver.session() as session:
            for methodology in methodologies:
                # Convert lists to strings for Neo4j compatibility
                params = methodology.copy()
                if 'steps' in params:
                    params['steps'] = params['steps']
                if 'phases' in params:
                    params['phases'] = params['phases']

                session.run("""
                    MERGE (m:Methodology {name: $name})
                    SET m += $props
                """, name=methodology['name'], props=params)

        print(f"✓ Created {len(methodologies)} Methodology nodes")

    def create_technical_patterns(self):
        """Create TechnicalPattern nodes"""
        patterns = [
            {
                'name': 'JSR/RTS Pattern',
                'category': '65816_assembly',
                'type': 'subroutine',
                'description': 'Standard subroutine call and return pattern',
                'code': 'JSR $A5C2  ; Jump to subroutine\nRTS        ; Return from subroutine',
                'notes': 'Short call within same bank, return address pushed to stack',
                'tags': ['assembly', '65816', 'subroutine', 'call']
            },
            {
                'name': 'JSL/RTL Pattern',
                'category': '65816_assembly',
                'type': 'subroutine',
                'description': 'Long subroutine call across banks',
                'code': 'JSL $82A5C2  ; Long jump to subroutine\nRTL          ; Return from long subroutine',
                'notes': 'Bank + return address pushed to stack',
                'tags': ['assembly', '65816', 'subroutine', 'long_call']
            },
            {
                'name': 'REP/SEP Register Switching',
                'category': '65816_assembly',
                'type': 'register_mode',
                'description': 'Switch between 8-bit and 16-bit register modes',
                'code': 'REP #$20  ; Set A to 16-bit\nSEP #$20  ; Set A to 8-bit\nREP #$30  ; Set A and X/Y to 16-bit',
                'notes': 'Critical for proper memory access, affects instruction size',
                'tags': ['assembly', '65816', 'register', 'mode_switch']
            },
            {
                'name': 'VRAM DMA Transfer',
                'category': 'dma',
                'type': 'graphics',
                'description': 'Standard pattern for DMA transfer to VRAM',
                'code': """REP #$20
LDA #VRAM_DEST
STA $2116       ; Set VRAM address
SEP #$20
LDA #$01
STA $4300       ; DMA mode
LDA #$18
STA $4301       ; Destination: VMDATAL
LDA #$01
STA $420B       ; Trigger DMA""",
                'registers_used': ['$2116', '$4300', '$4301', '$420B'],
                'tags': ['dma', 'vram', 'graphics', 'transfer']
            },
            {
                'name': 'Save Data Pattern',
                'category': 'memory',
                'type': 'sram',
                'description': 'Common save slot organization (Zelda 3 example)',
                'memory_map': {
                    '$7EF000-$7EF4FF': 'Save slot 1',
                    '$7EF500-$7EF9FF': 'Save slot 2',
                    '$7EFA00-$7EFEFF': 'Save slot 3'
                },
                'tags': ['memory', 'sram', 'save', 'zelda3']
            },
            {
                'name': 'Sprite OAM Structure',
                'category': 'memory',
                'type': 'graphics',
                'description': 'Object Attribute Memory structure for sprites',
                'structure': '128 sprites × 4 bytes + 32 bytes extended',
                'bytes': {
                    '0': 'X position (low 8 bits)',
                    '1': 'Y position',
                    '2': 'Tile number',
                    '3': 'Attributes (priority, palette, flip, X high)'
                },
                'tags': ['memory', 'oam', 'sprite', 'graphics']
            },
            {
                'name': 'State Machine Pattern',
                'category': 'memory',
                'type': 'game_state',
                'description': 'Common game state variable organization',
                'typical_layout': {
                    '$10': 'Game mode (title, gameplay, pause)',
                    '$11': 'Submode/phase',
                    '$12': 'Frame counter',
                    '$13-$1F': 'Mode-specific scratch'
                },
                'tags': ['memory', 'state', 'game_logic']
            },
            {
                'name': 'RNG Pattern',
                'category': 'algorithm',
                'type': 'random',
                'description': 'Linear Congruential Generator for randomness',
                'formula': 'RNG_state = (RNG_state * multiplier + increment) & 0xFFFF',
                'typical_address': '$1A (2 bytes)',
                'tags': ['algorithm', 'rng', 'random']
            }
        ]

        with self.driver.session() as session:
            for pattern in patterns:
                # Convert dict fields to strings for storage
                params = pattern.copy()
                if 'memory_map' in params:
                    params['memory_map_str'] = str(params.pop('memory_map'))
                if 'bytes' in params:
                    params['bytes_str'] = str(params.pop('bytes'))
                if 'typical_layout' in params:
                    params['layout_str'] = str(params.pop('typical_layout'))
                if 'registers_used' in params:
                    params['registers_used'] = params['registers_used']

                session.run("""
                    MERGE (p:TechnicalPattern {name: $name})
                    SET p += $props
                """, name=pattern['name'], props=params)

        print(f"✓ Created {len(patterns)} TechnicalPattern nodes")

    def create_resources(self):
        """Create Resource nodes for community documentation"""
        resources = [
            {
                'name': 'SNESdev Wiki',
                'type': 'documentation',
                'url': 'https://snes.nesdev.org/wiki/Main_Page',
                'description': 'Comprehensive SNES hardware documentation',
                'content': ['memory map reference', 'hardware register docs', '65C816 instruction set', 'timing diagrams'],
                'tags': ['documentation', 'wiki', 'hardware', 'reference']
            },
            {
                'name': 'RetroReversing',
                'type': 'tutorial',
                'url': 'https://www.retroreversing.com/snes/',
                'description': 'Game-specific reverse engineering guides and tutorials',
                'content': ['game-specific guides', 'tool tutorials', 'development history'],
                'tags': ['tutorial', 'guides', 'community']
            },
            {
                'name': 'ROM Hacking.net',
                'type': 'community',
                'url': 'https://www.romhacking.net/documents/',
                'description': 'Document library and utilities database',
                'content': ['document library', 'utilities database', 'translation projects'],
                'tags': ['community', 'tools', 'documents']
            },
            {
                'name': 'SMWCentral',
                'type': 'community',
                'url': 'https://www.smwcentral.net/',
                'description': 'Super Mario World modding community',
                'content': ['ASM tutorials', 'SMWDisC disassembly', 'modding resources'],
                'tags': ['community', 'mario', 'modding', 'tutorials']
            },
            {
                'name': 'TASVideos',
                'type': 'community',
                'url': 'http://tasvideos.org/ReverseEngineering',
                'description': 'Tool-assisted speedrun community with RE resources',
                'content': ['RAM address documentation', 'Lua scripts', 'RNG analysis'],
                'tags': ['community', 'tas', 'speedrun', 'tools']
            },
            {
                'name': 'SMWDisC',
                'type': 'project',
                'url': 'https://github.com/SMWCentral/smwdisc',
                'description': 'Fully commented Super Mario World disassembly',
                'content': ['complete source code', 'documentation', 'best practices example'],
                'tags': ['project', 'disassembly', 'mario', 'example']
            },
            {
                'name': 'Zelda 3 Disassembly',
                'type': 'project',
                'url': 'https://github.com/zelda3team/zelda3',
                'description': 'Complete 65816 assembly source for Zelda 3',
                'content': ['complete assembly', 'organized by banks', 'buildable with WLA DX'],
                'tags': ['project', 'disassembly', 'zelda', 'example']
            },
            {
                'name': '65816 Programming Manual',
                'type': 'documentation',
                'description': 'Official Western Design Center 65816 programming reference',
                'content': ['instruction set', 'addressing modes', 'programming patterns'],
                'tags': ['documentation', '65816', 'reference', 'official']
            }
        ]

        with self.driver.session() as session:
            for resource in resources:
                session.run("""
                    MERGE (r:Resource {name: $name})
                    SET r += $props
                """, name=resource['name'], props=resource)

        print(f"✓ Created {len(resources)} Resource nodes")

    def create_best_practices(self):
        """Create BestPractice nodes"""
        practices = [
            {
                'name': 'Use Automated Tools First',
                'category': 'disassembly',
                'description': 'Start with automated disassemblers, then manually refine',
                'rationale': 'Combines speed of automation with accuracy of manual work',
                'applies_to': ['disassembly workflow'],
                'tags': ['disassembly', 'workflow', 'efficiency']
            },
            {
                'name': 'Document RAM Addresses',
                'category': 'documentation',
                'description': 'Maintain comprehensive RAM maps during analysis',
                'format': 'Address, name, type, description, usage',
                'applies_to': ['memory analysis'],
                'tags': ['documentation', 'memory', 'organization']
            },
            {
                'name': 'Test on Real Hardware',
                'category': 'validation',
                'description': 'Verify modifications work on actual SNES hardware',
                'rationale': 'Emulators may not catch timing or hardware-specific issues',
                'applies_to': ['rom hacking', 'validation'],
                'tags': ['testing', 'hardware', 'validation']
            },
            {
                'name': 'Use Version Control',
                'category': 'project_management',
                'description': 'Track disassembly changes with git',
                'benefits': ['change tracking', 'collaboration', 'backup'],
                'applies_to': ['disassembly projects'],
                'tags': ['git', 'vcs', 'collaboration']
            },
            {
                'name': 'Write Comprehensive Comments',
                'category': 'documentation',
                'description': 'Document function purpose, inputs, outputs, and behavior',
                'example_format': '; Function, Purpose, Inputs, Outputs, Modifies, Called by',
                'applies_to': ['disassembly', 'code documentation'],
                'tags': ['documentation', 'comments', 'assembly']
            },
            {
                'name': 'Start Small, Progress Complex',
                'category': 'learning',
                'description': 'Begin with palette swaps, progress to ASM hacks',
                'progression': ['palette swaps', 'text edits', 'graphics edits', 'simple ASM', 'complex ASM'],
                'applies_to': ['learning path'],
                'tags': ['learning', 'progression', 'education']
            },
            {
                'name': 'Use Existing Tools First',
                'category': 'efficiency',
                'description': 'Leverage community tools before writing new ones',
                'rationale': 'Avoid reinventing the wheel, focus on analysis',
                'applies_to': ['tool selection'],
                'tags': ['tools', 'efficiency', 'community']
            },
            {
                'name': 'Limit Trace Duration',
                'category': 'debugging',
                'description': 'Keep trace logs short to avoid performance impact',
                'performance_impact': '60% slowdown with CPU tracing',
                'applies_to': ['trace logging', 'debugging'],
                'tags': ['tracing', 'performance', 'debugging']
            }
        ]

        with self.driver.session() as session:
            for practice in practices:
                session.run("""
                    MERGE (b:BestPractice {name: $name})
                    SET b += $props
                """, name=practice['name'], props=practice)

        print(f"✓ Created {len(practices)} BestPractice nodes")

    def create_workflows(self):
        """Create detailed Workflow nodes"""
        workflows = [
            {
                'name': 'Finding Hidden Item Code',
                'category': 'example',
                'goal': 'Locate code that gives specific item in game',
                'steps': [
                    'Use RAM search to find item flag address',
                    'Set write breakpoint on address',
                    'Trigger item acquisition in game',
                    'Examine code at breakpoint',
                    'Trace back through JSR calls',
                    'Document event trigger'
                ],
                'example_game': 'Zelda 3 - Hookshot',
                'duration': '1-3 hours',
                'difficulty': 'beginner',
                'tags': ['workflow', 'example', 'items', 'zelda3']
            },
            {
                'name': 'Understanding RNG',
                'category': 'example',
                'goal': 'Reverse engineer random number generator',
                'steps': [
                    'Observe random events',
                    'Search for changing WRAM values',
                    'Set read/write breakpoints',
                    'Discover RNG routine',
                    'Reverse engineer formula',
                    'Write prediction script',
                    'Use for TAS optimization'
                ],
                'example_game': 'Zelda 3 - RNG at $7E1A',
                'duration': '4-8 hours',
                'difficulty': 'intermediate',
                'tags': ['workflow', 'example', 'rng', 'algorithm']
            },
            {
                'name': 'Complete Disassembly Workflow',
                'category': 'example',
                'goal': 'Create buildable disassembly of entire game',
                'steps': [
                    'Automated disassembly with DiztinGUIsh',
                    'Export to ASM files by bank',
                    'Debug and label routines',
                    'Extract assets',
                    'Create linker script',
                    'Iteratively test build',
                    'Document in README',
                    'Release on GitHub'
                ],
                'duration': '500-2000+ hours',
                'difficulty': 'expert',
                'tags': ['workflow', 'disassembly', 'complete', 'project']
            }
        ]

        with self.driver.session() as session:
            for workflow in workflows:
                session.run("""
                    MERGE (w:Workflow {name: $name})
                    SET w += $props
                """, name=workflow['name'], props=workflow)

        print(f"✓ Created {len(workflows)} Workflow nodes")

    def create_relationships(self):
        """Create relationships between nodes"""
        with self.driver.session() as session:
            # Tools → Methodologies
            tool_methodology_relationships = [
                ('bsnes-plus', 'Breakpoint-First Approach'),
                ('bsnes-plus', 'Comparison Method'),
                ('Snes9x', 'RAM Search Workflow'),
                ('DiztinGUIsh', 'Automated Disassembly'),
                ('snes2asm', 'Automated Disassembly'),
            ]

            for tool, methodology in tool_methodology_relationships:
                session.run("""
                    MATCH (t:Tool {name: $tool})
                    MATCH (m:Methodology {name: $methodology})
                    MERGE (t)-[:USED_FOR]->(m)
                """, tool=tool, methodology=methodology)

            # Methodologies → Tools (RequiresTool)
            methodology_tool_relationships = [
                ('Breakpoint-First Approach', 'bsnes-plus'),
                ('Automated Disassembly', 'DiztinGUIsh'),
                ('Automated Disassembly', 'snes2asm'),
            ]

            for methodology, tool in methodology_tool_relationships:
                session.run("""
                    MATCH (m:Methodology {name: $methodology})
                    MATCH (t:Tool {name: $tool})
                    MERGE (m)-[:REQUIRES_TOOL]->(t)
                """, methodology=methodology, tool=tool)

            # TechnicalPatterns → Resources (DocumentedIn)
            pattern_resource_relationships = [
                ('JSR/RTS Pattern', '65816 Programming Manual'),
                ('JSL/RTL Pattern', '65816 Programming Manual'),
                ('REP/SEP Register Switching', '65816 Programming Manual'),
                ('VRAM DMA Transfer', 'SNESdev Wiki'),
                ('Save Data Pattern', 'Zelda 3 Disassembly'),
                ('Sprite OAM Structure', 'SNESdev Wiki'),
            ]

            for pattern, resource in pattern_resource_relationships:
                session.run("""
                    MATCH (p:TechnicalPattern {name: $pattern})
                    MATCH (r:Resource {name: $resource})
                    MERGE (p)-[:DOCUMENTED_IN]->(r)
                """, pattern=pattern, resource=resource)

            # BestPractices → Methodologies
            practice_methodology_relationships = [
                ('Use Automated Tools First', 'Automated Disassembly'),
                ('Document RAM Addresses', 'RAM Search Workflow'),
                ('Limit Trace Duration', 'Breakpoint-First Approach'),
            ]

            for practice, methodology in practice_methodology_relationships:
                session.run("""
                    MATCH (b:BestPractice {name: $practice})
                    MATCH (m:Methodology {name: $methodology})
                    MERGE (b)-[:APPLIES_TO]->(m)
                """, practice=practice, methodology=methodology)

            # Workflows → Tools
            workflow_tool_relationships = [
                ('Finding Hidden Item Code', 'bsnes-plus'),
                ('Understanding RNG', 'bsnes-plus'),
                ('Complete Disassembly Workflow', 'DiztinGUIsh'),
                ('Complete Disassembly Workflow', 'snes2asm'),
            ]

            for workflow, tool in workflow_tool_relationships:
                session.run("""
                    MATCH (w:Workflow {name: $workflow})
                    MATCH (t:Tool {name: $tool})
                    MERGE (w)-[:USES_TOOL]->(t)
                """, workflow=workflow, tool=tool)

            # Workflows → Methodologies
            workflow_methodology_relationships = [
                ('Finding Hidden Item Code', 'Breakpoint-First Approach'),
                ('Understanding RNG', 'RAM Search Workflow'),
                ('Complete Disassembly Workflow', 'Automated Disassembly'),
            ]

            for workflow, methodology in workflow_methodology_relationships:
                session.run("""
                    MATCH (w:Workflow {name: $workflow})
                    MATCH (m:Methodology {name: $methodology})
                    MERGE (w)-[:IMPLEMENTS]->(m)
                """, workflow=workflow, methodology=methodology)

            print("✓ Created relationships between nodes")

    def create_indexes(self):
        """Create indexes for better query performance"""
        with self.driver.session() as session:
            # Create indexes on commonly searched fields
            session.run("CREATE INDEX tool_name IF NOT EXISTS FOR (t:Tool) ON (t.name)")
            session.run("CREATE INDEX tool_category IF NOT EXISTS FOR (t:Tool) ON (t.category)")
            session.run("CREATE INDEX methodology_name IF NOT EXISTS FOR (m:Methodology) ON (m.name)")
            session.run("CREATE INDEX pattern_name IF NOT EXISTS FOR (p:TechnicalPattern) ON (p.name)")
            session.run("CREATE INDEX pattern_category IF NOT EXISTS FOR (p:TechnicalPattern) ON (p.category)")
            session.run("CREATE INDEX resource_name IF NOT EXISTS FOR (r:Resource) ON (r.name)")
            session.run("CREATE INDEX practice_name IF NOT EXISTS FOR (b:BestPractice) ON (b.name)")
            session.run("CREATE INDEX workflow_name IF NOT EXISTS FOR (w:Workflow) ON (w.name)")

            print("✓ Created indexes for query performance")

    def verify_storage(self):
        """Verify all knowledge was stored correctly"""
        with self.driver.session() as session:
            # Count nodes
            result = session.run("""
                MATCH (n)
                WHERE n:Tool OR n:Methodology OR n:TechnicalPattern OR
                      n:Resource OR n:BestPractice OR n:Workflow
                RETURN labels(n)[0] as type, count(n) as count
                ORDER BY type
            """)

            print("\n📊 Knowledge Graph Summary:")
            total = 0
            for record in result:
                print(f"  {record['type']}: {record['count']} nodes")
                total += record['count']
            print(f"  Total: {total} nodes")

            # Count relationships
            rel_result = session.run("""
                MATCH ()-[r]->()
                WHERE type(r) IN ['USED_FOR', 'REQUIRES_TOOL', 'DOCUMENTED_IN',
                                 'APPLIES_TO', 'USES_TOOL', 'IMPLEMENTS']
                RETURN type(r) as type, count(r) as count
                ORDER BY type
            """)

            print("\n🔗 Relationships:")
            total_rels = 0
            for record in rel_result:
                print(f"  {record['type']}: {record['count']} relationships")
                total_rels += record['count']
            print(f"  Total: {total_rels} relationships")

    def load_all_knowledge(self, clear_existing: bool = False):
        """Load all reverse engineering knowledge into Neo4j"""
        print("\n🚀 Loading SNES Reverse Engineering Knowledge into Neo4j\n")

        if clear_existing:
            self.clear_existing_knowledge()

        self.create_tools()
        self.create_methodologies()
        self.create_technical_patterns()
        self.create_resources()
        self.create_best_practices()
        self.create_workflows()
        self.create_relationships()
        self.create_indexes()
        self.verify_storage()

        print("\n✅ Knowledge loading complete!")


def main():
    """Main entry point"""
    import sys

    # Check for Neo4j password
    if not os.getenv("NEO4J_PASSWORD"):
        print("❌ Error: NEO4J_PASSWORD environment variable not set")
        print("   Set it with: export NEO4J_PASSWORD=your_password")
        sys.exit(1)

    try:
        loader = ReverseEngineeringKnowledgeLoader()

        # Ask if user wants to clear existing knowledge
        clear = False
        if len(sys.argv) > 1 and sys.argv[1] == "--clear":
            clear = True
            print("⚠️  Will clear existing reverse engineering knowledge")

        loader.load_all_knowledge(clear_existing=clear)
        loader.close()

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

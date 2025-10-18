#!/usr/bin/env python3
"""
Neo4j Query Examples for SNES Knowledge Graph

This script provides example queries and utilities for working with the
SNES knowledge graph in Neo4j.

Usage:
    export NEO4J_URI="neo4j+s://xxx.databases.neo4j.io"
    export NEO4J_USER="neo4j"
    export NEO4J_PASSWORD="xxx"

    python tools/neo4j_query_examples.py --query mods-by-component
    python tools/neo4j_query_examples.py --query ppu-registers
    python tools/neo4j_query_examples.py --interactive
"""

import argparse
import os
from neo4j import GraphDatabase
from typing import List, Dict, Any


class SNESGraphQuery:
    """Query utilities for SNES knowledge graph"""

    def __init__(self, uri: str, user: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        self.driver.verify_connectivity()

    def close(self):
        self.driver.close()

    def execute_query(self, query: str, parameters: Dict = None) -> List[Dict]:
        """Execute a Cypher query and return results"""
        with self.driver.session() as session:
            result = session.run(query, parameters or {})
            return [dict(record) for record in result]

    # ===== PROJECT QUERIES =====

    def list_projects(self) -> List[Dict]:
        """List all projects in the repository"""
        return self.execute_query("""
            MATCH (p:Project)
            RETURN p.name as name, p.type as type, p.language as language,
                   p.description as description
            ORDER BY p.name
        """)

    def get_project_components(self, project_name: str) -> List[Dict]:
        """Get all components for a project"""
        return self.execute_query("""
            MATCH (c:Component)-[:PART_OF]->(p:Project {name: $project_name})
            RETURN c.name as name, c.type as type, c.description as description
            ORDER BY c.type, c.name
        """, {"project_name": project_name})

    # ===== MOD QUERIES =====

    def list_mods(self) -> List[Dict]:
        """List all available mods"""
        return self.execute_query("""
            MATCH (m:Mod)
            RETURN m.name as name, m.type as type, m.description as description,
                   m.affected_bytes as bytes_changed
            ORDER BY m.type, m.name
        """)

    def get_mod_details(self, mod_name: str) -> Dict:
        """Get detailed information about a specific mod"""
        results = self.execute_query("""
            MATCH (m:Mod {name: $mod_name})-[:TARGETS]->(p:Project)
            OPTIONAL MATCH (m)-[r:MODIFIES]->(c:Component)
            RETURN m.name as mod_name, m.description as description,
                   m.affected_bytes as bytes_changed, p.name as project,
                   collect({component: c.name, change: r.description}) as changes
        """, {"mod_name": mod_name})

        return results[0] if results else {}

    def find_mods_by_component(self, component_name: str) -> List[Dict]:
        """Find all mods that affect a specific component"""
        return self.execute_query("""
            MATCH (m:Mod)-[:MODIFIES]->(c:Component {name: $component_name})
            RETURN m.name as mod, m.description as description,
                   m.affected_bytes as bytes_changed
        """, {"component_name": component_name})

    # ===== HARDWARE QUERIES =====

    def list_registers(self, category: str = None) -> List[Dict]:
        """List hardware registers, optionally filtered by category"""
        if category:
            return self.execute_query("""
                MATCH (r:Register {category: $category})
                RETURN r.address as address, r.name as name,
                       r.description as description, r.access_type as access
                ORDER BY r.address
            """, {"category": category})
        else:
            return self.execute_query("""
                MATCH (r:Register)
                RETURN r.address as address, r.name as name,
                       r.category as category, r.description as description
                ORDER BY r.category, r.address
            """)

    def get_memory_map(self) -> List[Dict]:
        """Get the SNES memory map"""
        return self.execute_query("""
            MATCH (m:MemoryRegion)
            RETURN m.name as region, m.start_addr as start, m.end_addr as end,
                   m.type as type, m.description as description
            ORDER BY m.start_addr
        """)

    # ===== KNOWLEDGE QUERIES =====

    def search_knowledge(self, keyword: str) -> List[Dict]:
        """Search knowledge base by keyword"""
        return self.execute_query("""
            MATCH (k:Knowledge)
            WHERE k.topic CONTAINS $keyword OR k.content CONTAINS $keyword
               OR ANY(tag IN k.tags WHERE tag CONTAINS $keyword)
            RETURN k.topic as topic, k.content as content, k.type as type,
                   k.tags as tags
        """, {"keyword": keyword})

    def get_knowledge_by_tag(self, tag: str) -> List[Dict]:
        """Get all knowledge with a specific tag"""
        return self.execute_query("""
            MATCH (k:Knowledge)
            WHERE $tag IN k.tags
            RETURN k.topic as topic, k.content as content, k.type as type
        """, {"tag": tag})

    # ===== COMPONENT QUERIES =====

    def get_component_functions(self, component_name: str) -> List[Dict]:
        """Get all functions in a component"""
        return self.execute_query("""
            MATCH (f:Function)-[:BELONGS_TO]->(c:Component {name: $component_name})
            RETURN f.name as function, f.file_path as file,
                   f.line_number as line, f.description as description
            ORDER BY f.name
        """, {"component_name": component_name})

    # ===== RELATIONSHIP QUERIES =====

    def get_mod_impact_summary(self) -> List[Dict]:
        """Get summary of what each mod affects"""
        return self.execute_query("""
            MATCH (m:Mod)-[:MODIFIES]->(c:Component)
            WITH m, collect(c.name) as components
            RETURN m.name as mod, m.type as type,
                   m.affected_bytes as bytes_changed,
                   components
            ORDER BY m.type, m.name
        """)

    def get_component_relationships(self, component_name: str) -> List[Dict]:
        """Get all relationships for a component"""
        return self.execute_query("""
            MATCH path = (c:Component {name: $component_name})-[r]-(other)
            RETURN type(r) as relationship, labels(other)[0] as other_type,
                   other.name as other_name
        """, {"component_name": component_name})

    # ===== ADVANCED QUERIES =====

    def find_shortest_path(self, from_name: str, to_name: str) -> List[Dict]:
        """Find shortest path between two entities"""
        return self.execute_query("""
            MATCH (start {name: $from_name}), (end {name: $to_name})
            MATCH path = shortestPath((start)-[*]-(end))
            RETURN [node in nodes(path) | {
                type: labels(node)[0],
                name: node.name
            }] as path, length(path) as depth
        """, {"from_name": from_name, "to_name": to_name})

    def get_graph_statistics(self) -> Dict[str, int]:
        """Get graph statistics"""
        stats = {}

        # Count each node type
        node_types = ["Project", "Component", "Mod", "Register", "MemoryRegion",
                     "Function", "Knowledge"]

        for node_type in node_types:
            result = self.execute_query(f"MATCH (n:{node_type}) RETURN count(n) as count")
            stats[node_type] = result[0]["count"]

        # Count relationships
        result = self.execute_query("MATCH ()-[r]->() RETURN count(r) as count")
        stats["Relationships"] = result[0]["count"]

        return stats


def print_table(data: List[Dict], title: str = ""):
    """Pretty print results as a table"""
    if not data:
        print("No results found.")
        return

    if title:
        print(f"\n{title}")
        print("=" * len(title))

    # Get all keys
    keys = list(data[0].keys())

    # Calculate column widths
    widths = {key: len(key) for key in keys}
    for row in data:
        for key in keys:
            value = str(row.get(key, ""))
            widths[key] = max(widths[key], len(value))

    # Print header
    header = " | ".join(key.ljust(widths[key]) for key in keys)
    print(header)
    print("-" * len(header))

    # Print rows
    for row in data:
        line = " | ".join(str(row.get(key, "")).ljust(widths[key]) for key in keys)
        print(line)

    print(f"\n({len(data)} rows)")


def interactive_mode(query: SNESGraphQuery):
    """Interactive query mode"""
    print("\n🔍 SNES Knowledge Graph - Interactive Query Mode")
    print("=" * 60)
    print("Available commands:")
    print("  projects         - List all projects")
    print("  mods             - List all mods")
    print("  ppu              - List PPU registers")
    print("  memory           - Show memory map")
    print("  stats            - Show graph statistics")
    print("  search <keyword> - Search knowledge base")
    print("  mod <name>       - Get mod details")
    print("  cypher           - Execute custom Cypher query")
    print("  quit             - Exit")
    print("=" * 60)

    while True:
        try:
            cmd = input("\n> ").strip().lower()

            if cmd == "quit" or cmd == "exit":
                break
            elif cmd == "projects":
                results = query.list_projects()
                print_table(results, "Projects")
            elif cmd == "mods":
                results = query.list_mods()
                print_table(results, "Mods")
            elif cmd == "ppu":
                results = query.list_registers("ppu")
                print_table(results, "PPU Registers")
            elif cmd == "memory":
                results = query.get_memory_map()
                print_table(results, "Memory Map")
            elif cmd == "stats":
                stats = query.get_graph_statistics()
                print("\nGraph Statistics:")
                for key, value in stats.items():
                    print(f"  {key}: {value}")
            elif cmd.startswith("search "):
                keyword = cmd[7:]
                results = query.search_knowledge(keyword)
                for r in results:
                    print(f"\n{r['topic']}")
                    print(f"  {r['content']}")
                    print(f"  Tags: {', '.join(r['tags'])}")
            elif cmd.startswith("mod "):
                mod_name = cmd[4:]
                result = query.get_mod_details(mod_name)
                if result:
                    print(f"\nMod: {result['mod_name']}")
                    print(f"Description: {result['description']}")
                    print(f"Bytes Changed: {result['bytes_changed']}")
                    print(f"Project: {result['project']}")
                    print("\nChanges:")
                    for change in result['changes']:
                        if change['component']:
                            print(f"  - {change['component']}: {change['change']}")
            elif cmd == "cypher":
                cypher_query = input("Cypher query> ")
                try:
                    results = query.execute_query(cypher_query)
                    if results:
                        print_table(results)
                    else:
                        print("Query executed successfully (no results)")
                except Exception as e:
                    print(f"Error: {e}")
            else:
                print("Unknown command. Type 'quit' to exit.")

        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"Error: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Query SNES Knowledge Graph"
    )
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
        "--query",
        choices=["projects", "mods", "ppu-registers", "memory-map", "stats",
                "mod-impact"],
        help="Pre-defined query to run"
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Start interactive query mode"
    )

    args = parser.parse_args()

    if not args.password:
        print("❌ Neo4j password required (--password or NEO4J_PASSWORD env var)")
        return 1

    query = SNESGraphQuery(args.uri, args.user, args.password)

    try:
        if args.interactive:
            interactive_mode(query)
        elif args.query == "projects":
            results = query.list_projects()
            print_table(results, "SNES Projects")
        elif args.query == "mods":
            results = query.list_mods()
            print_table(results, "Available Mods")
        elif args.query == "ppu-registers":
            results = query.list_registers("ppu")
            print_table(results, "PPU Registers")
        elif args.query == "memory-map":
            results = query.get_memory_map()
            print_table(results, "SNES Memory Map")
        elif args.query == "stats":
            stats = query.get_graph_statistics()
            print("\n📊 Knowledge Graph Statistics")
            print("=" * 40)
            for key, value in stats.items():
                print(f"{key:20s}: {value:5d}")
        elif args.query == "mod-impact":
            results = query.get_mod_impact_summary()
            for mod in results:
                print(f"\n{mod['mod']} ({mod['type']})")
                print(f"  Bytes changed: {mod['bytes_changed']}")
                print(f"  Components: {', '.join(mod['components'])}")
        else:
            print("Use --query or --interactive to query the graph")
            print("Run with --help for usage information")

    finally:
        query.close()

    return 0


if __name__ == "__main__":
    exit(main())

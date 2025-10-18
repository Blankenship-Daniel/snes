#!/usr/bin/env python3
"""
Learning Extractor for Claude Code Sessions

This module extracts key learnings from Claude Code conversation sessions
and stores them in the Neo4j knowledge graph for future retrieval.

It extracts:
- Code implementations (what was built, which files, changes made)
- Technical decisions (architecture choices, approaches taken)
- Domain knowledge (SNES-specific learnings, hardware insights)
- Best practices (patterns discovered, pitfalls avoided)
- Relationships (component interactions, dependencies)
"""

import os
import json
import subprocess
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime


class LearningExtractor:
    """Extracts learnings from conversation sessions"""

    def __init__(self, session_file: Path = None):
        """
        Initialize the learning extractor.

        Args:
            session_file: Path to session markdown file
        """
        self.session_file = session_file
        self.project_dir = Path(os.getenv("CLAUDE_PROJECT_DIR", "."))

    def read_session_content(self) -> Optional[str]:
        """
        Read the session file content.

        Returns:
            Session content as string or None if failed
        """
        if not self.session_file or not self.session_file.exists():
            return None

        try:
            return self.session_file.read_text()
        except Exception:
            return None

    def extract_learnings_with_codex(self, context: str = None) -> Optional[List[Dict]]:
        """
        Use Codex CLI to extract learnings from the session.

        Args:
            context: Additional context to provide (e.g., session summary)

        Returns:
            List of learning dictionaries with structure:
            [
                {
                    "topic": "Brief topic title",
                    "content": "Detailed learning content",
                    "type": "implementation|decision|knowledge|best_practice",
                    "entities": ["component1", "register1"],
                    "tags": ["tag1", "tag2"]
                }
            ]
        """
        import shutil

        if not shutil.which("codex"):
            return None

        # Build extraction prompt
        prompt = """Analyze this Claude Code session and extract key learnings.

For each learning, identify:
1. **Topic**: A concise 5-10 word title
2. **Content**: 1-2 sentences describing what was learned
3. **Type**: One of: implementation, decision, knowledge, best_practice
4. **Entities**: Any SNES-specific entities mentioned (components, registers, mods, projects)
5. **Tags**: Relevant keywords for later retrieval

Focus on extracting:
- Code implementations (what was built, which files modified)
- Technical decisions made (why certain approaches were chosen)
- SNES domain knowledge (hardware insights, register usage)
- Best practices discovered
- Pitfalls avoided

Format each learning as:
---
**Topic**: [Brief title]
**Content**: [1-2 sentence description]
**Type**: [implementation|decision|knowledge|best_practice]
**Entities**: [comma-separated list]
**Tags**: [comma-separated list]
---

Extract only meaningful, specific learnings - not generic information.
"""

        if context:
            prompt += f"\n\nContext:\n{context}\n"

        try:
            result = subprocess.run(
                ["codex", "exec", prompt],
                capture_output=True,
                text=True,
                cwd=str(self.project_dir),
                timeout=60
            )

            if result.returncode == 0 and result.stdout:
                return self._parse_codex_output(result.stdout)

        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
            pass

        return None

    def _parse_codex_output(self, output: str) -> List[Dict]:
        """
        Parse Codex output into structured learnings.

        Args:
            output: Raw Codex output

        Returns:
            List of learning dictionaries
        """
        learnings = []

        # Split by separator
        blocks = output.split('---')

        for block in blocks:
            if not block.strip():
                continue

            learning = {
                "topic": "",
                "content": "",
                "type": "knowledge",
                "entities": [],
                "tags": []
            }

            # Parse fields
            lines = block.strip().split('\n')
            for line in lines:
                line = line.strip()

                if line.startswith('**Topic**:'):
                    learning["topic"] = line.replace('**Topic**:', '').strip()
                elif line.startswith('**Content**:'):
                    learning["content"] = line.replace('**Content**:', '').strip()
                elif line.startswith('**Type**:'):
                    type_val = line.replace('**Type**:', '').strip().lower()
                    if type_val in ['implementation', 'decision', 'knowledge', 'best_practice']:
                        learning["type"] = type_val
                elif line.startswith('**Entities**:'):
                    entities_str = line.replace('**Entities**:', '').strip()
                    learning["entities"] = [e.strip() for e in entities_str.split(',') if e.strip()]
                elif line.startswith('**Tags**:'):
                    tags_str = line.replace('**Tags**:', '').strip()
                    learning["tags"] = [t.strip() for t in tags_str.split(',') if t.strip()]

            # Only add if we have topic and content
            if learning["topic"] and learning["content"]:
                learnings.append(learning)

        return learnings

    def extract_learnings_from_git_diff(self) -> List[Dict]:
        """
        Extract learnings from git diff (what files were changed).

        Returns:
            List of learnings based on file changes
        """
        learnings = []

        try:
            # Get modified files
            result = subprocess.run(
                ["git", "status", "--short"],
                capture_output=True,
                text=True,
                cwd=str(self.project_dir)
            )

            if result.returncode != 0 or not result.stdout.strip():
                return learnings

            modified_files = result.stdout.strip().split('\n')

            # Group by type
            modified_components = []
            modified_docs = []
            modified_tools = []

            for line in modified_files:
                parts = line.strip().split()
                if len(parts) < 2:
                    continue

                file_path = parts[-1]

                if '/zelda3/' in file_path or '/sprite' in file_path:
                    modified_components.append(file_path)
                elif file_path.endswith('.md'):
                    modified_docs.append(file_path)
                elif '/tools/' in file_path:
                    modified_tools.append(file_path)

            # Create learnings based on modifications
            if modified_components:
                learnings.append({
                    "topic": "Modified Game Components",
                    "content": f"Modified components: {', '.join(modified_components[:3])}",
                    "type": "implementation",
                    "entities": self._extract_component_names(modified_components),
                    "tags": ["modification", "implementation", "zelda3"]
                })

            if modified_tools:
                learnings.append({
                    "topic": "Updated Development Tools",
                    "content": f"Modified tools: {', '.join(modified_tools[:3])}",
                    "type": "implementation",
                    "entities": [],
                    "tags": ["tooling", "development"]
                })

        except Exception:
            pass

        return learnings

    def _extract_component_names(self, file_paths: List[str]) -> List[str]:
        """Extract component names from file paths"""
        components = set()

        for path in file_paths:
            # Extract component from path like "zelda3/player.c" -> "player"
            if '/' in path:
                filename = path.split('/')[-1]
                name = filename.split('.')[0]
                if name and name not in ['test', 'main', 'index']:
                    components.add(name)

        return list(components)

    def extract_all_learnings(self) -> List[Dict]:
        """
        Extract all learnings from the session.

        Combines:
        - Codex-based intelligent extraction
        - Git diff-based file change extraction

        Returns:
            Complete list of learnings
        """
        all_learnings = []

        # Read session content
        session_content = self.read_session_content()

        # Try Codex extraction first
        if session_content:
            codex_learnings = self.extract_learnings_with_codex(session_content[:2000])
            if codex_learnings:
                all_learnings.extend(codex_learnings)

        # Add git-based learnings
        git_learnings = self.extract_learnings_from_git_diff()
        all_learnings.extend(git_learnings)

        return all_learnings


class LearningStorage:
    """Stores learnings in Neo4j knowledge graph"""

    def __init__(self, uri: str = None, user: str = None, password: str = None):
        """Initialize Neo4j connection"""
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = user or os.getenv("NEO4J_USER", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD")

        self.driver = None
        if self.password:
            try:
                from neo4j import GraphDatabase
                self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
                self.driver.verify_connectivity()
            except Exception:
                self.driver = None

    def close(self):
        """Close Neo4j connection"""
        if self.driver:
            self.driver.close()

    def is_available(self) -> bool:
        """Check if Neo4j is available"""
        return self.driver is not None

    def store_learning(self, learning: Dict, session_id: str = None) -> bool:
        """
        Store a single learning in Neo4j.

        Args:
            learning: Learning dictionary with topic, content, type, entities, tags
            session_id: Optional session identifier

        Returns:
            True if stored successfully
        """
        if not self.is_available():
            return False

        try:
            with self.driver.session() as session:
                # Create knowledge node
                knowledge_id = f"session_learning:{datetime.now().strftime('%Y%m%d_%H%M%S')}:{learning['topic'][:20]}"

                session.run("""
                    MERGE (k:Knowledge {id: $id})
                    SET k.topic = $topic,
                        k.content = $content,
                        k.type = $type,
                        k.tags = $tags,
                        k.session_id = $session_id,
                        k.created = datetime(),
                        k.source = 'session_extraction'
                """, id=knowledge_id, topic=learning["topic"], content=learning["content"],
                    type=learning["type"], tags=learning["tags"], session_id=session_id or "")

                # Link to entities if they exist
                for entity in learning.get("entities", []):
                    # Try to link to existing Component, Mod, or Register
                    session.run("""
                        MATCH (k:Knowledge {id: $knowledge_id})
                        OPTIONAL MATCH (c:Component) WHERE toLower(c.name) CONTAINS toLower($entity)
                        OPTIONAL MATCH (m:Mod) WHERE toLower(m.name) CONTAINS toLower($entity)
                        OPTIONAL MATCH (r:Register) WHERE toLower(r.name) CONTAINS toLower($entity)
                        WITH k, COALESCE(c, m, r) as target
                        WHERE target IS NOT NULL
                        MERGE (k)-[:DOCUMENTS]->(target)
                    """, knowledge_id=knowledge_id, entity=entity)

            return True

        except Exception as e:
            print(f"Failed to store learning: {e}")
            return False

    def store_all_learnings(self, learnings: List[Dict], session_id: str = None) -> int:
        """
        Store multiple learnings.

        Args:
            learnings: List of learning dictionaries
            session_id: Optional session identifier

        Returns:
            Number of learnings successfully stored
        """
        count = 0
        for learning in learnings:
            if self.store_learning(learning, session_id):
                count += 1
        return count


def extract_and_store_session_learnings(session_file: Path, session_id: str = None) -> Dict:
    """
    Complete workflow: extract learnings from session and store in Neo4j.

    Args:
        session_file: Path to session markdown file
        session_id: Optional session identifier

    Returns:
        Dictionary with results:
        {
            "learnings_extracted": int,
            "learnings_stored": int,
            "neo4j_available": bool
        }
    """
    # Extract learnings
    extractor = LearningExtractor(session_file)
    learnings = extractor.extract_all_learnings()

    results = {
        "learnings_extracted": len(learnings),
        "learnings_stored": 0,
        "neo4j_available": False,
        "learnings": learnings
    }

    if not learnings:
        return results

    # Store in Neo4j
    storage = LearningStorage()
    results["neo4j_available"] = storage.is_available()

    if storage.is_available():
        results["learnings_stored"] = storage.store_all_learnings(learnings, session_id)
        storage.close()

    return results


# CLI interface
if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        session_file = Path(sys.argv[1])
        if not session_file.exists():
            print(f"❌ Session file not found: {session_file}")
            sys.exit(1)

        print(f"📚 Extracting learnings from: {session_file}")

        results = extract_and_store_session_learnings(session_file)

        print(f"\n✅ Extracted {results['learnings_extracted']} learnings")

        if results["neo4j_available"]:
            print(f"✅ Stored {results['learnings_stored']} learnings in Neo4j")

            # Print learnings
            for i, learning in enumerate(results["learnings"], 1):
                print(f"\n{i}. **{learning['topic']}** ({learning['type']})")
                print(f"   {learning['content']}")
                if learning['entities']:
                    print(f"   Entities: {', '.join(learning['entities'])}")
                if learning['tags']:
                    print(f"   Tags: {', '.join(learning['tags'])}")
        else:
            print("⚠️  Neo4j not available - learnings not stored")
            print("   Start Neo4j: ./tools/neo4j-docker.sh start")

    else:
        print("Usage: python tools/learning_extractor.py <session_file>")
        sys.exit(1)

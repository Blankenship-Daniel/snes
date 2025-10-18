#!/bin/bash

# Neo4j Docker Management Script
# Manages a local Neo4j instance via Docker

set -e

CONTAINER_NAME="neo4j-snes"
NEO4J_PASSWORD="snes-graph-2024"
HTTP_PORT="7474"
BOLT_PORT="7687"
VOLUME_NAME="neo4j-snes-data"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🐳 Neo4j Docker Manager"
echo "======================="

# Function to check if container exists
container_exists() {
    docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"
}

# Function to check if container is running
container_running() {
    docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"
}

# Function to start Neo4j
start_neo4j() {
    echo ""
    if container_running; then
        echo -e "${YELLOW}⚠️  Neo4j is already running${NC}"
        show_info
        return
    fi

    if container_exists; then
        echo "▶️  Starting existing Neo4j container..."
        docker start ${CONTAINER_NAME}
    else
        echo "🆕 Creating new Neo4j container..."
        docker run -d \
            --name ${CONTAINER_NAME} \
            -p ${HTTP_PORT}:7474 \
            -p ${BOLT_PORT}:7687 \
            -e NEO4J_AUTH=neo4j/${NEO4J_PASSWORD} \
            -e NEO4J_PLUGINS='["apoc"]' \
            -v ${VOLUME_NAME}:/data \
            neo4j:latest

        echo ""
        echo -e "${GREEN}✅ Neo4j container created${NC}"
    fi

    echo ""
    echo "⏳ Waiting for Neo4j to be ready..."

    # Wait for Neo4j to be ready (max 60 seconds)
    COUNTER=0
    until docker exec ${CONTAINER_NAME} cypher-shell -u neo4j -p ${NEO4J_PASSWORD} "RETURN 1" &> /dev/null || [ $COUNTER -eq 60 ]; do
        printf "."
        sleep 1
        ((COUNTER++))
    done
    echo ""

    if [ $COUNTER -eq 60 ]; then
        echo -e "${RED}❌ Timeout waiting for Neo4j to start${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Neo4j is ready!${NC}"
    show_info
}

# Function to stop Neo4j
stop_neo4j() {
    echo ""
    if ! container_running; then
        echo -e "${YELLOW}⚠️  Neo4j is not running${NC}"
        return
    fi

    echo "⏸️  Stopping Neo4j container..."
    docker stop ${CONTAINER_NAME}
    echo -e "${GREEN}✅ Neo4j stopped${NC}"
}

# Function to restart Neo4j
restart_neo4j() {
    echo ""
    echo "🔄 Restarting Neo4j..."
    stop_neo4j
    sleep 2
    start_neo4j
}

# Function to show status
status_neo4j() {
    echo ""
    if container_running; then
        echo -e "${GREEN}✅ Neo4j is running${NC}"
        show_info
    elif container_exists; then
        echo -e "${YELLOW}⏸️  Neo4j container exists but is stopped${NC}"
        echo "   Run: $0 start"
    else
        echo -e "${RED}❌ Neo4j container does not exist${NC}"
        echo "   Run: $0 start"
    fi
}

# Function to show connection info
show_info() {
    echo ""
    echo "📍 Connection Information:"
    echo "   Browser:  http://localhost:${HTTP_PORT}"
    echo "   Bolt URI: bolt://localhost:${BOLT_PORT}"
    echo "   Username: neo4j"
    echo "   Password: ${NEO4J_PASSWORD}"
    echo ""
    echo "💡 Environment variables:"
    echo "   export NEO4J_URI='bolt://localhost:${BOLT_PORT}'"
    echo "   export NEO4J_USER='neo4j'"
    echo "   export NEO4J_PASSWORD='${NEO4J_PASSWORD}'"
    echo ""
    echo "🔗 Quick links:"
    echo "   Browse: http://localhost:${HTTP_PORT}/browser/"
    echo "   Populate: python3 tools/neo4j_populate.py"
}

# Function to view logs
logs_neo4j() {
    if ! container_running; then
        echo -e "${RED}❌ Neo4j is not running${NC}"
        exit 1
    fi

    echo "📋 Neo4j logs (Ctrl+C to exit):"
    echo ""
    docker logs -f ${CONTAINER_NAME}
}

# Function to remove container and data
remove_neo4j() {
    echo ""
    echo -e "${RED}⚠️  WARNING: This will remove the container and ALL DATA${NC}"
    read -p "Are you sure? (type 'yes' to confirm): " confirm

    if [ "$confirm" != "yes" ]; then
        echo "Cancelled"
        return
    fi

    if container_running; then
        echo "Stopping container..."
        docker stop ${CONTAINER_NAME}
    fi

    if container_exists; then
        echo "Removing container..."
        docker rm ${CONTAINER_NAME}
    fi

    echo "Removing volume..."
    docker volume rm ${VOLUME_NAME} 2>/dev/null || true

    echo -e "${GREEN}✅ Neo4j removed${NC}"
}

# Function to export credentials to .env file
export_env() {
    ENV_FILE=".env.neo4j"
    echo ""
    echo "📝 Exporting credentials to ${ENV_FILE}..."

    cat > ${ENV_FILE} << EOF
# Neo4j Docker Configuration
# Source this file: source ${ENV_FILE}

export NEO4J_URI="bolt://localhost:${BOLT_PORT}"
export NEO4J_USER="neo4j"
export NEO4J_PASSWORD="${NEO4J_PASSWORD}"
EOF

    echo -e "${GREEN}✅ Credentials exported to ${ENV_FILE}${NC}"
    echo ""
    echo "To use:"
    echo "  source ${ENV_FILE}"
    echo "  python3 tools/neo4j_populate.py"
}

# Function to run cypher shell
shell_neo4j() {
    if ! container_running; then
        echo -e "${RED}❌ Neo4j is not running${NC}"
        exit 1
    fi

    echo "🐚 Opening Cypher shell (type :exit to quit)..."
    echo ""
    docker exec -it ${CONTAINER_NAME} cypher-shell -u neo4j -p ${NEO4J_PASSWORD}
}

# Main script
case "${1}" in
    start)
        start_neo4j
        ;;
    stop)
        stop_neo4j
        ;;
    restart)
        restart_neo4j
        ;;
    status)
        status_neo4j
        ;;
    logs)
        logs_neo4j
        ;;
    info)
        show_info
        ;;
    remove)
        remove_neo4j
        ;;
    export-env)
        export_env
        ;;
    shell)
        shell_neo4j
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|info|export-env|shell|remove}"
        echo ""
        echo "Commands:"
        echo "  start       - Start Neo4j container"
        echo "  stop        - Stop Neo4j container"
        echo "  restart     - Restart Neo4j container"
        echo "  status      - Check Neo4j status"
        echo "  logs        - View Neo4j logs"
        echo "  info        - Show connection information"
        echo "  export-env  - Export credentials to .env.neo4j"
        echo "  shell       - Open Cypher shell"
        echo "  remove      - Remove container and data (WARNING: destructive)"
        echo ""
        exit 1
        ;;
esac

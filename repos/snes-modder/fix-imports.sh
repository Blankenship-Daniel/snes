#!/bin/bash
# Mass fix imports - Ship it!

echo "Fixing type imports across the codebase..."

# Replace rom-discovery imports with unified-types
find src -name "*.ts" -exec sed -i.bak \
  -e "s|from '\.\./types/rom-discovery'|from '../types/unified-types'|g" \
  -e "s|from '\.\./\.\./types/rom-discovery'|from '../../types/unified-types'|g" \
  -e "s|from '\.\./lib/UnifiedAddressSystem'|from '../types/unified-types'|g" \
  {} \;

# Clean up backup files
find src -name "*.ts.bak" -delete

echo "Import fixes applied!"

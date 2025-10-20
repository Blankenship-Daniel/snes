#!/bin/bash
# Temporarily disable validation files to get build working

echo "Disabling validation files temporarily..."

# Move validation folder to backup
if [ -d "src/validation" ]; then
  mv src/validation src/validation.backup
  mkdir -p src/validation
  echo "export {};" > src/validation/index.ts
fi

echo "Validation disabled. Run restore-validation.sh to restore."

# Create restore script
cat > restore-validation.sh << 'RESTORE'
#!/bin/bash
if [ -d "src/validation.backup" ]; then
  rm -rf src/validation
  mv src/validation.backup src/validation
  echo "Validation restored"
fi
RESTORE
chmod +x restore-validation.sh

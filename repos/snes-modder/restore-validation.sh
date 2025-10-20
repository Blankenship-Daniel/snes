#!/bin/bash
if [ -d "src/validation.backup" ]; then
  rm -rf src/validation
  mv src/validation.backup src/validation
  echo "Validation restored"
fi

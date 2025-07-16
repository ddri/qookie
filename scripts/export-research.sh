#!/bin/bash
# Export current research data

echo "Exporting research data..."
cp localStorage/research-data.json data/research-data-$(date +%Y%m%d).json
git add data/research-data-*.json
git commit -m "Export research data - $(date +%Y-%m-%d)"
echo "✓ Research data exported"
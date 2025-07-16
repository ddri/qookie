#!/bin/bash
# Update partnerships from a new source

echo "Updating quantum partnerships..."
cp ~/Downloads/new-partnerships.csv data/quantum-partnerships.csv
git add data/quantum-partnerships.csv
git commit -m "Update partnerships - $(date +%Y-%m-%d)"
echo "✓ Partnerships updated"
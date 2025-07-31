#!/bin/bash
# Update partnerships from a new source

echo "Updating quantum partnerships..."
cp ~/Downloads/new-partnerships.csv public/data/quantum-partnerships.csv
git add public/data/quantum-partnerships.csv
git commit -m "Update partnerships - $(date +%Y-%m-%d)"
echo "✓ Partnerships updated"
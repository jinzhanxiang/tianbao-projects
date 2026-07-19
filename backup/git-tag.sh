#!/bin/bash
# Git tag backup script
# Created: 2026-07-19 23:08
# Task: #task-20260719-tianbao-rebuild

cd ~/Documents/tianbao-projects

echo "=== Creating git tag backup ==="

# Create annotated tag
git tag -a tianbao-projects-pre-v6-rebuild -m "Backup before V6 rebuild - M1 Phase 1 complete

Timestamp: $(date -u +"%Y-%m-%d %H:%M UTC")
Created by: project agent
Task: #task-20260719-tianbao-rebuild

Files backed up:
- PHASE1_STATUS.md (现状盘点)
- backup/ (本脚本)
- data/ (待创建)

Next step: Phase 2 分层次版式设计"

if [ $? -eq 0 ]; then
    echo "✅ Git tag created: tianbao-projects-pre-v6-rebuild"
    echo ""
    echo "=== Tag list ==="
    git tag -l
else
    echo "❌ Failed to create tag"
    exit 1
fi

echo ""
echo "=== Done ==="
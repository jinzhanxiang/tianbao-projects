#!/bin/bash
# update_wiki_data.sh — 定时更新 wiki 数据脚本
python3 ~/.hermes/scripts/wiki_data_update.py 2>&1
cd ~/Documents/tianbao-projects && git add -A && git commit -m "chore: 自动更新 wiki_data.json $(date '+%Y-%m-%d %H:%M')" && git push origin main
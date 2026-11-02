#!/bin/bash
set -e  # エラーが発生したらそこで処理を中断

echo "=== 1. Pulling latest code from GitHub ==="
git pull origin main

echo "=== 2. Installing dependencies ==="
npm ci

echo "=== 3. Building Next.js application ==="
npm run build

echo "=== 4. Reloading PM2 process ==="
pm2 restart syllabus-app

echo "=== Deployment Completed Successfully! ==="

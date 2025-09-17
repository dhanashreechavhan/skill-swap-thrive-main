#!/bin/bash

# GitHub Repository Setup Script
# Replace 'yourusername' with your actual GitHub username

echo "Setting up GitHub repository connection..."

# Your GitHub repository URL
GITHUB_REPO_URL="https://github.com/MJ-Sec4yoU/swap-learn-thrive.git"

echo "Adding remote origin..."
git remote add origin $GITHUB_REPO_URL

echo "Renaming branch to main..."
git branch -M main

echo "Pushing to GitHub..."
git push -u origin main

echo "✅ Repository successfully pushed to GitHub!"
echo "Your project is now available at: $GITHUB_REPO_URL"
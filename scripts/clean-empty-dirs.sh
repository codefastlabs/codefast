#!/bin/bash

# Script to clean empty directories in packages folder
# Usage: ./scripts/clean-empty-dirs.sh [--dry-run] [--include-node-modules] [--force]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
DRY_RUN=false
EXCLUDE_NODE_MODULES=true
FORCE=false
PACKAGES_DIR="packages"

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Clean empty directories in the packages folder"
    echo "Note: node_modules directories are excluded by default"
    echo ""
    echo "OPTIONS:"
    echo "  --dry-run              Show what would be deleted without actually deleting"
    echo "  --include-node-modules Include node_modules directories in deletion"
    echo "  --force                Skip confirmation prompt"
    echo "  --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                     Interactive mode with confirmation (excludes node_modules)"
    echo "  $0 --dry-run           Preview what would be deleted (excludes node_modules)"
    echo "  $0 --force             Delete without confirmation (excludes node_modules)"
    echo "  $0 --include-node-modules --dry-run  Preview including node_modules"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --include-node-modules)
            EXCLUDE_NODE_MODULES=false
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Check if packages directory exists
if [[ ! -d "$PACKAGES_DIR" ]]; then
    echo -e "${RED}✗ $PACKAGES_DIR directory not found!${NC}"
    echo "Make sure you're running this script from the project root."
    exit 1
fi

echo -e "${BLUE}🧹 Cleaning empty directories in $PACKAGES_DIR${NC}"
echo ""

# Build find command
FIND_CMD="find $PACKAGES_DIR -type d -empty"

# Handle node_modules inclusion/exclusion
if [[ "$EXCLUDE_NODE_MODULES" == true ]]; then
    FIND_CMD="$FIND_CMD -not -path '*/node_modules/*'"
    echo -e "${YELLOW}i Excluding node_modules directories (default behavior)${NC}"
else
    echo -e "${YELLOW}i Including node_modules directories${NC}"
fi

# Find empty directories
EMPTY_DIRS=$(eval $FIND_CMD)

if [[ -z "$EMPTY_DIRS" ]]; then
    echo -e "${GREEN}✓ No empty directories found in $PACKAGES_DIR${NC}"
    exit 0
fi

# Count empty directories
DIR_COUNT=$(echo "$EMPTY_DIRS" | wc -l | tr -d ' ')

echo -e "${YELLOW}Found $DIR_COUNT empty directories:${NC}"
echo ""

# Display the directories that will be deleted
echo "$EMPTY_DIRS" | while read -r dir; do
    echo -e "  ${RED}⌫ $dir${NC}"
done

echo ""

if [[ "$DRY_RUN" == true ]]; then
    echo -e "${BLUE}⌕ Dry run mode - no directories were deleted${NC}"
    echo -e "${BLUE}Run without --dry-run to actually delete these directories${NC}"
    exit 0
fi

# Confirmation prompt (unless --force is used)
if [[ "$FORCE" != true ]]; then
    echo -e "${YELLOW}! This will permanently delete $DIR_COUNT empty directories.${NC}"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Operation cancelled.${NC}"
        exit 0
    fi
fi

# Delete empty directories
echo -e "${BLUE}⌫ Deleting empty directories...${NC}"
DELETED_COUNT=0

echo "$EMPTY_DIRS" | while read -r dir; do
    if [[ -d "$dir" ]]; then
        if rmdir "$dir" 2>/dev/null; then
            echo -e "  ${GREEN}✓ Deleted: $dir${NC}"
            ((DELETED_COUNT++))
        else
            echo -e "  ${RED}✗ Failed to delete: $dir${NC}"
        fi
    fi
done

# Final summary
echo ""
echo -e "${GREEN}★ Cleanup completed!${NC}"

# Re-check for any remaining empty directories
REMAINING_DIRS=$(eval $FIND_CMD)
if [[ -z "$REMAINING_DIRS" ]]; then
    echo -e "${GREEN}✓ All empty directories have been removed from $PACKAGES_DIR${NC}"
else
    REMAINING_COUNT=$(echo "$REMAINING_DIRS" | wc -l | tr -d ' ')
    echo -e "${YELLOW}i $REMAINING_COUNT directories could not be deleted (may contain hidden files)${NC}"
fi

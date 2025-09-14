#!/bin/bash

# Script to recursively clean empty directories in the entire project
# This version can handle nested empty directories in a single run
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
PROJECT_ROOT="."

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Recursively clean empty directories in the entire project"
    echo "This version can handle nested empty directories in a single run"
    echo "Note: node_modules, .git, dist, coverage, and other build directories are excluded by default"
    echo ""
    echo "OPTIONS:"
    echo "  --dry-run              Show what would be deleted without actually deleting"
    echo "  --include-node-modules Include node_modules directories in deletion"
    echo "  --force                Skip confirmation prompt"
    echo "  --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                     Interactive mode with confirmation (excludes build dirs)"
    echo "  $0 --dry-run           Preview what would be deleted (excludes build dirs)"
    echo "  $0 --force             Delete without confirmation (excludes build dirs)"
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

# Check if we're in a project root (look for package.json)
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}✗ package.json not found!${NC}"
    echo "Make sure you're running this script from the project root."
    exit 1
fi

echo -e "${BLUE}🧹 Recursively cleaning empty directories in the entire project${NC}"
echo ""

# Function to recursively find and delete empty directories
clean_empty_dirs_recursive() {
    local deleted_count=0
    local iteration=1
    local found_any=false
    local confirmed=false
    
    while true; do
        # Build find command with exclusions for common build/cache directories
        FIND_CMD="find $PROJECT_ROOT -type d -empty"
        
        # Always exclude common directories that should not be deleted
        EXCLUDED_PATHS=(
            ".git"
            "dist"
            "coverage"
            ".next"
            ".turbo"
            "build"
            ".cache"
            ".parcel-cache"
            ".eslintcache"
        )
        
        # Add exclusions for common directories
        for path in "${EXCLUDED_PATHS[@]}"; do
            FIND_CMD="$FIND_CMD -not -path '*/$path/*' -not -name '$path'"
        done
        
        # Handle node_modules inclusion/exclusion
        if [[ "$EXCLUDE_NODE_MODULES" == true ]]; then
            FIND_CMD="$FIND_CMD -not -path '*/node_modules/*'"
        fi
        
        # Find empty directories
        EMPTY_DIRS=$(eval $FIND_CMD)
        
        if [[ -z "$EMPTY_DIRS" ]]; then
            break
        fi
        
        found_any=true
        
        # Count empty directories
        DIR_COUNT=$(echo "$EMPTY_DIRS" | wc -l | tr -d ' ')
        
        if [[ "$iteration" == 1 ]]; then
            echo -e "${YELLOW}Iteration $iteration: Found $DIR_COUNT empty directories${NC}"
        else
            echo -e "${YELLOW}Iteration $iteration: Found $DIR_COUNT more empty directories${NC}"
        fi
        
        # Display the directories that will be deleted
        echo "$EMPTY_DIRS" | while read -r dir; do
            echo -e "  ${RED}⌫ $dir${NC}"
        done
        
        if [[ "$DRY_RUN" == true ]]; then
            echo -e "${BLUE}⌕ Dry run mode - no directories were deleted${NC}"
            echo -e "${BLUE}Run without --dry-run to actually delete these directories${NC}"
            return 0
        fi
        
        # Confirmation prompt (only once, unless --force is used)
        if [[ "$FORCE" != true && "$confirmed" == false ]]; then
            echo ""
            echo -e "${YELLOW}! This will permanently delete empty directories recursively.${NC}"
            read -p "Do you want to continue? (y/N): " -n 1 -r
            echo ""
            
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${BLUE}Operation cancelled.${NC}"
                return 0
            fi
            confirmed=true
        fi
        
        # Delete empty directories
        echo -e "${BLUE}⌫ Deleting empty directories...${NC}"
        
        echo "$EMPTY_DIRS" | while read -r dir; do
            if [[ -d "$dir" ]]; then
                if rmdir "$dir" 2>/dev/null; then
                    echo -e "  ${GREEN}✓ Deleted: $dir${NC}"
                    ((deleted_count++))
                else
                    echo -e "  ${RED}✗ Failed to delete: $dir${NC}"
                fi
            fi
        done
        
        ((iteration++))
        echo ""
    done
    
    if [[ "$found_any" == false ]]; then
        echo -e "${GREEN}✓ No empty directories found in the project${NC}"
        return 0
    fi
    
    return 1
}

# Handle node_modules inclusion/exclusion message
if [[ "$EXCLUDE_NODE_MODULES" == true ]]; then
    echo -e "${YELLOW}i Excluding node_modules and build directories (default behavior)${NC}"
else
    echo -e "${YELLOW}i Including node_modules directories${NC}"
fi

# Run the recursive cleanup
clean_empty_dirs_recursive
RESULT=$?

if [[ "$RESULT" == 0 ]]; then
    exit 0
fi

# If we reach here, cleanup was successful
echo ""
echo -e "${GREEN}★ Recursive cleanup completed!${NC}"

# Final check for any remaining empty directories
FIND_CMD="find $PROJECT_ROOT -type d -empty"
EXCLUDED_PATHS=(
    ".git"
    "dist"
    "coverage"
    ".next"
    ".turbo"
    "build"
    ".cache"
    ".parcel-cache"
    ".eslintcache"
)

for path in "${EXCLUDED_PATHS[@]}"; do
    FIND_CMD="$FIND_CMD -not -path '*/$path/*' -not -name '$path'"
done

if [[ "$EXCLUDE_NODE_MODULES" == true ]]; then
    FIND_CMD="$FIND_CMD -not -path '*/node_modules/*'"
fi

REMAINING_DIRS=$(eval $FIND_CMD)
if [[ -z "$REMAINING_DIRS" ]]; then
    echo -e "${GREEN}✓ All empty directories have been removed from the project${NC}"
else
    REMAINING_COUNT=$(echo "$REMAINING_DIRS" | wc -l | tr -d ' ')
    echo -e "${YELLOW}i $REMAINING_COUNT directories could not be deleted (may contain hidden files)${NC}"
fi

# Scripts Directory

This directory contains utility scripts for the CodeFast project.

## clean-empty-dirs.sh

A terminal script to clean empty directories in the `packages` folder.

**Note**: node_modules directories are excluded by default for safety.

### Usage

```bash
# Interactive mode with confirmation (excludes node_modules by default)
./scripts/clean-empty-dirs.sh

# Preview what would be deleted (dry run, excludes node_modules by default)
./scripts/clean-empty-dirs.sh --dry-run

# Delete without confirmation (excludes node_modules by default)
./scripts/clean-empty-dirs.sh --force

# Include node_modules directories in deletion
./scripts/clean-empty-dirs.sh --include-node-modules

# Combine options - preview including node_modules
./scripts/clean-empty-dirs.sh --dry-run --include-node-modules
```

### Options

- `--dry-run`: Show what would be deleted without actually deleting
- `--include-node-modules`: Include node_modules directories in deletion (they are excluded by default)
- `--force`: Skip confirmation prompt
- `--help`: Show help message

### Features

- ✅ Safe operation with confirmation prompts
- ✅ Dry-run mode for preview
- ✅ Colored output with emojis for better readability
- ✅ Excludes node_modules directories by default for safety
- ✅ Option to include node_modules directories when needed
- ✅ Error handling and validation
- ✅ Progress feedback during deletion
- ✅ Summary of results

### Examples

```bash
# Preview all empty directories (excludes node_modules by default)
./scripts/clean-empty-dirs.sh --dry-run

# Clean all empty directories including node_modules
./scripts/clean-empty-dirs.sh --include-node-modules

# Quick cleanup without prompts (excludes node_modules by default)
./scripts/clean-empty-dirs.sh --force
```

### Notes

- The script only deletes truly empty directories (no files or subdirectories)
- Parent directories may become empty after their subdirectories are removed
- Run the script multiple times to clean up nested empty directory structures
- The script is safe to run - it won't delete directories containing files

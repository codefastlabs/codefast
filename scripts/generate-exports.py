#!/usr/bin/env python3

"""
Automatically generate package.json exports from the dist directory.

This script scans the dist directory recursively, identifies valid module files,
and generates the appropriate export paths for both ESM and CommonJS formats.

Usage:
    python scripts/generate-exports.py [package-path]

Examples:
    python scripts/generate-exports.py packages/image-loader
    python scripts/generate-exports.py packages/ui
    python scripts/generate-exports.py  (uses current directory)

## Algorithm Overview

### 1. Scan Dist Directory
   Recursively reads the dist/ directory structure and filters files with
   valid extensions (.js, .cjs, .d.ts), excluding non-entry point files.

### 2. Group Files by Module
   Groups files by their base name (without extension). Each module should
   have three files: .js, .cjs, and .d.ts. For example, index.js, index.cjs,
   and index.d.ts form the "index" module.

### 3. Create Export Paths
   Converts file paths to export paths by removing the "dist/" prefix:
   - dist/index.* → "."
   - dist/loaders/cloudinary.* → "./loaders/cloudinary"
   - dist/core/types.* → "./core/types"

### 4. Validate Modules
   Only creates exports for modules that have at least .js and .d.ts files.
   The .cjs file is optional but recommended for CommonJS support.

### 5. Generate Exports Object
   Creates an exports object with the following structure:
   {
     "{export-path}": {
       "types": "./dist/{path}.d.ts",
       "import": "./dist/{path}.js",
       "require": "./dist/{path}.cjs"
     }
   }
   Exports are sorted alphabetically and "./package.json" is always included.

### 6. Update package.json
   Reads the current package.json, merges the new exports (preserving other
   fields), and writes the file back with proper formatting.
"""

from __future__ import annotations

import json
import sys
import subprocess
import time
import traceback
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable


# =============================================================================
# ANSI Colors
# =============================================================================

class Colors:
    """ANSI color codes for terminal output."""

    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'

    # Colors
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    GRAY = '\033[90m'

    # Bright colors
    BRIGHT_GREEN = '\033[92m'
    BRIGHT_YELLOW = '\033[93m'
    BRIGHT_CYAN = '\033[96m'

    @classmethod
    def disable(cls) -> None:
        """Disable all colors (for non-TTY output)."""
        for attr in dir(cls):
            if attr.isupper() and not attr.startswith('_'):
                setattr(cls, attr, '')


# Disable colors if not a TTY
if not sys.stdout.isatty():
    Colors.disable()


# =============================================================================
# Statistics Tracking
# =============================================================================

@dataclass
class PackageStats:
    """Stats for a single package."""

    name: str
    path: Path
    js_modules: int = 0
    css_exports: int = 0
    total_exports: int = 0
    has_transform: bool = False
    css_config_status: str = ''  # 'disabled', 'configured', ''
    skipped: bool = False
    skip_reason: str = ''
    error: str | None = None


@dataclass
class GlobalStats:
    """Track overall generation statistics."""

    packages_found: int = 0
    packages_processed: int = 0
    packages_skipped: int = 0
    packages_errored: int = 0
    total_exports: int = 0
    total_js_modules: int = 0
    total_css_exports: int = 0
    package_details: list[PackageStats] = field(default_factory=list)


# =============================================================================
# Constants
# =============================================================================

DIST_DIR = 'dist'
PACKAGE_JSON = 'package.json'
CONFIG_FILE_JS = 'generate-exports.config.js'
CONFIG_FILE_JSON = 'generate-exports.config.json'
VALID_JS_EXTENSIONS = {'.js', '.cjs'}
DTS_EXTENSION = '.d.ts'
PACKAGE_JSON_EXPORT = './package.json'


class ModuleFiles:
    """Represents the file structure of a module."""
    def __init__(self):
        self.js: str | None = None
        self.cjs: str | None = None
        self.dts: str | None = None


class Module:
    """Represents a complete module with its path and associated files."""
    def __init__(self, path: str):
        self.path = path
        self.files = ModuleFiles()


def normalize_path(path: Path) -> str:
    """Normalize a path to use forward slashes."""
    return str(path).replace('\\', '/')


def scan_directory(dir_path: Path, base_dir: Path | None = None) -> list[str]:
    """Recursively scan a directory to find all files."""
    if base_dir is None:
        base_dir = dir_path

    files: list[str] = []

    try:
        for entry in dir_path.iterdir():
            if entry.is_dir():
                files.extend(scan_directory(entry, base_dir))
            elif entry.is_file():
                relative_path = entry.relative_to(base_dir)
                files.append(normalize_path(relative_path))
    except (PermissionError, OSError):
        pass

    return files


def group_files_by_module(files: list[str]) -> dict[str, Module]:
    """Group files by their module name (without extension)."""
    modules: dict[str, Module] = {}

    for file in files:
        # Handle .d.ts first (special case - double extension)
        if file.endswith(DTS_EXTENSION):
            ext = DTS_EXTENSION
            module_path = file[:-len(DTS_EXTENSION)]
        else:
            ext = Path(file).suffix
            if ext not in VALID_JS_EXTENSIONS:
                continue
            module_path = file[:-len(ext)]

        # Skip if file is in a subdirectory without a filename
        if not Path(module_path).name:
            continue

        if module_path not in modules:
            modules[module_path] = Module(module_path)

        module = modules[module_path]

        if ext == '.js':
            module.files.js = file
        elif ext == '.cjs':
            module.files.cjs = file
        elif ext == DTS_EXTENSION:
            module.files.dts = file

    return modules


def is_valid_module(module: Module) -> bool:
    """Validate that a module has the required files."""
    return module.files.js is not None and module.files.dts is not None


def to_export_path(dist_path: str) -> str:
    """Convert a dist path to an export path."""
    if dist_path == 'index':
        return '.'

    if dist_path.endswith('/index'):
        return f'./{dist_path[:-6]}'

    return f'./{dist_path}'


def create_export_entry(
    module: Module,
    path_transform: Callable[[str], str] | None = None
) -> tuple[str, dict[str, str]]:
    """Create an export entry object for a module."""
    export_path = to_export_path(module.path)

    if path_transform:
        export_path = path_transform(export_path)

    dist_path = f'./dist/{module.path}'

    entry: dict[str, str] = {
        'types': f'{dist_path}.d.ts'
    }

    if module.files.js:
        entry['import'] = f'{dist_path}.js'

    if module.files.cjs:
        entry['require'] = f'{dist_path}.cjs'

    return export_path, entry


def load_config(root_dir: Path) -> dict:
    """Load configuration file from the root directory."""
    config_path_js = root_dir / CONFIG_FILE_JS
    config_path_json = root_dir / CONFIG_FILE_JSON

    if config_path_js.exists():
        try:
            result = subprocess.run(
                ['node', '-e', f'''
                    const config = require("{config_path_js.resolve()}");
                    console.log(JSON.stringify(config.default || config));
                '''],
                capture_output=True,
                text=True,
                check=True
            )
            return json.loads(result.stdout)
        except (subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError):
            print(f'{Colors.YELLOW}⚠ Could not evaluate .js config. Falling back to .json{Colors.RESET}')

    if config_path_json.exists():
        try:
            with open(config_path_json, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            print(f'{Colors.YELLOW}⚠ Could not parse {CONFIG_FILE_JSON}: {e}{Colors.RESET}')

    return {}


def create_path_transform(
    config: dict | None,
    package_path: str
) -> Callable[[str], str] | None:
    """Create a path transformation function from configuration."""
    if not config:
        return None

    transform = config.get('pathTransformations', {}).get(package_path)
    if not transform:
        return None

    remove_prefix = transform.get('removePrefix')
    if not remove_prefix:
        return None

    def path_transform(export_path: str) -> str:
        if not export_path.startswith(remove_prefix):
            return export_path

        result = export_path[len(remove_prefix):]
        if result and result != '.' and not result.startswith('./'):
            return f'./{result}'
        return result

    return path_transform


def scan_css_files(dist_dir: Path, base_dir: Path | None = None) -> list[str]:
    """Recursively scan for CSS files in the dist directory."""
    if base_dir is None:
        base_dir = dist_dir

    files: list[str] = []

    try:
        for entry in dist_dir.iterdir():
            if entry.is_dir():
                files.extend(scan_css_files(entry, base_dir))
            elif entry.is_file() and entry.name.endswith('.css'):
                relative_path = entry.relative_to(base_dir)
                files.append(normalize_path(relative_path))
    except (PermissionError, OSError):
        pass

    return files


def is_directory_css_only(dist_dir: Path, dir_path: str) -> bool:
    """Check if a directory contains only CSS files."""
    full_path = dist_dir / dir_path

    try:
        entries = list(full_path.iterdir())
        if not entries:
            return True
        return all(
            entry.is_file() and entry.name.endswith('.css')
            for entry in entries
        )
    except (PermissionError, OSError):
        return False


def generate_css_exports(
    dist_dir: Path,
    css_config: dict | bool | None
) -> dict[str, str]:
    """Generate CSS exports based on auto-detected CSS files."""
    if isinstance(css_config, bool):
        if not css_config:
            return {}
        css_config = {'enabled': True}

    if not css_config or css_config.get('enabled') is False:
        return {}

    css_files = scan_css_files(dist_dir)
    if not css_files:
        return {}

    css_exports: dict[str, str] = {}
    custom_exports = css_config.get('customExports', {})
    css_exports.update(custom_exports)

    css_by_dir: dict[str, list[str]] = {}
    root_css: list[str] = []

    for file in css_files:
        dir_name = str(Path(file).parent)
        if dir_name == '.':
            root_css.append(file)
        else:
            css_by_dir.setdefault(dir_name, []).append(file)

    for file in root_css:
        export_path = f'./{file}'
        if export_path not in custom_exports:
            css_exports[export_path] = f'./dist/{file}'

    force_files = css_config.get('forceExportFiles', False)
    for dir_name, files in css_by_dir.items():
        if not files:
            continue

        is_css_only = is_directory_css_only(dist_dir, dir_name)

        if is_css_only and not force_files:
            wildcard_export = f'./{dir_name}/*'
            if wildcard_export not in custom_exports:
                css_exports[wildcard_export] = f'./dist/{dir_name}/*'
        else:
            for file in files:
                export_path = f'./{file}'
                if export_path not in custom_exports:
                    css_exports[export_path] = f'./dist/{file}'

    return css_exports


GROUP_ORDER: dict[str, int] = {
    'components': 100,
    'hooks': 200,
    'primitives': 300,
    'core': 400,
    'loaders': 500,
    'utils': 600,
    'adapters': 700,
    'script': 750,
    'css': 900,
}


def get_export_group(
    path: str,
    path_transform: Callable[[str], str] | None = None
) -> tuple[str, str, int, int]:
    """Extract directory group from export path for sorting purposes."""
    if path == '.':
        return ('.', '', 0, 0)

    clean_path = path[2:] if path.startswith('./') else path

    if clean_path.endswith('/*'):
        dir_name = clean_path[:-2]
        order = 900 if dir_name == 'css' else 100
        return (dir_name, '', order, 0)

    parts = clean_path.split('/')

    if len(parts) == 1:
        name = parts[0]
        if name in GROUP_ORDER:
            order = GROUP_ORDER[name]
            return (name, '', order, 0)
        if path_transform is not None:
            return ('components', name, 100, 1)
        return ('', name, 800, 1)

    group = parts[0]
    subpath = '/'.join(parts[1:])
    order = GROUP_ORDER.get(group, 700)

    return (group, subpath, order, 1)


def generate_exports(
    dist_dir: Path,
    path_transform: Callable[[str], str] | None = None,
    css_config: dict | bool | None = None
) -> tuple[dict[str, dict[str, str] | str], int, int]:
    """Generate exports from the dist directory. Returns (exports, js_count, css_count)."""
    files = scan_directory(dist_dir)
    if not files:
        return {PACKAGE_JSON_EXPORT: PACKAGE_JSON_EXPORT}, 0, 0

    modules = group_files_by_module(files)
    if not modules:
        return {PACKAGE_JSON_EXPORT: PACKAGE_JSON_EXPORT}, 0, 0

    valid_modules = [m for m in modules.values() if is_valid_module(m)]
    if not valid_modules:
        return {PACKAGE_JSON_EXPORT: PACKAGE_JSON_EXPORT}, 0, 0

    exports: dict[str, dict[str, str]] = {}
    for module in valid_modules:
        export_path, entry = create_export_entry(module, path_transform)
        exports[export_path] = entry

    js_count = len(exports)

    def sort_key(path: str) -> tuple[int, str, int, str]:
        group, subpath, order, is_index = get_export_group(path, path_transform)
        return (order, group, is_index, subpath)

    sorted_exports: dict[str, dict[str, str] | str] = {
        key: exports[key] for key in sorted(exports.keys(), key=sort_key)
    }

    if css_config is not None:
        css_exports = generate_css_exports(dist_dir, css_config)
    else:
        css_files = scan_css_files(dist_dir)
        css_exports = generate_css_exports(dist_dir, {'enabled': True}) if css_files else {}

    css_count = len(css_exports)

    sorted_exports.update(css_exports)
    all_keys = sorted(sorted_exports.keys(), key=sort_key)
    final_exports = {key: sorted_exports[key] for key in all_keys}
    final_exports[PACKAGE_JSON_EXPORT] = PACKAGE_JSON_EXPORT

    return final_exports, js_count, css_count


def get_relative_path(package_dir: Path, root_dir: Path) -> str:
    """Get relative path from root directory, normalized with forward slashes."""
    try:
        return normalize_path(package_dir.relative_to(root_dir))
    except ValueError:
        return str(package_dir)


def update_package_json(
    package_json_path: Path,
    new_exports: dict[str, dict[str, str] | str]
) -> dict:
    """Update package.json with new exports."""
    with open(package_json_path, 'r', encoding='utf-8') as f:
        package_json = json.load(f)

    package_json['exports'] = new_exports

    with open(package_json_path, 'w', encoding='utf-8') as f:
        json.dump(package_json, f, indent=2, ensure_ascii=False)
        f.write('\n')

    return package_json


def process_package(
    package_dir: Path,
    root_dir: Path,
    config: dict,
    stats: GlobalStats,
    index: int,
    total: int,
    verbose: bool = False,
) -> PackageStats:
    """Process a single package to generate and update its exports."""
    dist_dir = package_dir / DIST_DIR
    package_json_path = package_dir / PACKAGE_JSON

    relative_path = get_relative_path(package_dir, root_dir)
    pkg_stats = PackageStats(name=package_dir.name, path=package_dir)

    # Check if package should be skipped
    if relative_path in config.get('skipPackages', []):
        pkg_stats.skipped = True
        pkg_stats.skip_reason = 'configured to skip'
        stats.packages_skipped += 1
        return pkg_stats

    if not package_json_path.exists() or not dist_dir.exists():
        pkg_stats.skipped = True
        pkg_stats.skip_reason = 'package.json or dist/ not found'
        stats.packages_skipped += 1
        return pkg_stats

    try:
        with open(package_json_path, 'r', encoding='utf-8') as f:
            package_json = json.load(f)

        package_name = package_json.get('name', package_dir.name)
        pkg_stats.name = package_name

        path_transform = create_path_transform(config, relative_path)
        pkg_stats.has_transform = path_transform is not None

        css_exports_config = config.get('cssExports', {})
        css_config = css_exports_config.get(relative_path) if css_exports_config else None

        if css_config is False:
            pkg_stats.css_config_status = 'disabled'
        elif css_config is not None:
            pkg_stats.css_config_status = 'configured'

        exports, js_count, css_count = generate_exports(dist_dir, path_transform, css_config)

        pkg_stats.js_modules = js_count
        pkg_stats.css_exports = css_count
        pkg_stats.total_exports = len(exports)

        update_package_json(package_json_path, exports)

        stats.packages_processed += 1
        stats.total_exports += len(exports)
        stats.total_js_modules += js_count
        stats.total_css_exports += css_count

        # Print progress
        progress = f'{Colors.DIM}[{index}/{total}]{Colors.RESET}'
        print(f'{progress} {Colors.BRIGHT_GREEN}✓{Colors.RESET} {Colors.BOLD}{package_name}{Colors.RESET}')

        if verbose:
            print(f'  {Colors.DIM}├─{Colors.RESET} Path: {package_dir}')
            if pkg_stats.has_transform:
                print(f'  {Colors.DIM}├─{Colors.RESET} {Colors.CYAN}Custom path transformation{Colors.RESET}')
            if pkg_stats.css_config_status:
                status_text = 'CSS disabled' if pkg_stats.css_config_status == 'disabled' else 'CSS configured'
                print(f'  {Colors.DIM}├─{Colors.RESET} {Colors.CYAN}{status_text}{Colors.RESET}')

        # Show breakdown
        breakdown_parts = []
        if js_count > 0:
            breakdown_parts.append(f'{Colors.GREEN}{js_count} modules{Colors.RESET}')
        if css_count > 0:
            breakdown_parts.append(f'{Colors.MAGENTA}{css_count} CSS{Colors.RESET}')

        if breakdown_parts:
            print(f'  {Colors.DIM}└─{Colors.RESET} {" + ".join(breakdown_parts)} = {Colors.BRIGHT_CYAN}{len(exports)} exports{Colors.RESET}')
        else:
            print(f'  {Colors.DIM}└─{Colors.RESET} {Colors.BRIGHT_CYAN}{len(exports)} exports{Colors.RESET}')

        print()

    except Exception as error:
        pkg_stats.error = str(error)
        stats.packages_errored += 1
        print(f'{Colors.DIM}[{index}/{total}]{Colors.RESET} {Colors.YELLOW}✗{Colors.RESET} {Colors.BOLD}{package_dir.name}{Colors.RESET}')
        print(f'  {Colors.DIM}└─{Colors.RESET} {Colors.YELLOW}Error: {error}{Colors.RESET}\n')
        if verbose:
            traceback.print_exc()

    return pkg_stats


def find_all_packages(
    packages_dir: Path,
    root_dir: Path,
    config: dict
) -> list[Path]:
    """Find all packages with a dist/ directory."""
    packages: list[Path] = []
    skip_packages = config.get('skipPackages', [])

    try:
        for entry in packages_dir.iterdir():
            if not entry.is_dir():
                continue

            relative_path = get_relative_path(entry, root_dir)
            if relative_path in skip_packages:
                continue

            dist_path = entry / DIST_DIR
            package_json_path = entry / PACKAGE_JSON

            if package_json_path.exists() and dist_path.exists():
                packages.append(entry)
    except (PermissionError, OSError) as error:
        print(f'{Colors.YELLOW}⚠ Error scanning packages directory: {error}{Colors.RESET}')

    return packages


# =============================================================================
# Output Formatting
# =============================================================================

def print_header() -> None:
    """Print the header banner."""
    print(f'\n{Colors.BOLD}{Colors.CYAN}📦 Generate Package Exports{Colors.RESET}')
    print(f'{Colors.DIM}{"═" * 60}{Colors.RESET}\n')


def print_summary(stats: GlobalStats, elapsed: float) -> None:
    """Print the final summary."""
    print(f'{Colors.DIM}{"═" * 60}{Colors.RESET}')
    print(f'{Colors.BOLD}📊 Summary{Colors.RESET} {Colors.DIM}(completed in {elapsed:.2f}s){Colors.RESET}\n')

    print(f'  {Colors.BOLD}Packages:{Colors.RESET}')
    print(f'  {Colors.DIM}├─{Colors.RESET} Processed: {Colors.GREEN}{stats.packages_processed}{Colors.RESET}')
    if stats.packages_skipped > 0:
        print(f'  {Colors.DIM}├─{Colors.RESET} Skipped: {Colors.GRAY}{stats.packages_skipped}{Colors.RESET}')
    if stats.packages_errored > 0:
        print(f'  {Colors.DIM}├─{Colors.RESET} Errors: {Colors.YELLOW}{stats.packages_errored}{Colors.RESET}')
    print(f'  {Colors.DIM}└─{Colors.RESET} Total found: {stats.packages_found}')

    print()
    print(f'  {Colors.BOLD}Exports:{Colors.RESET}')
    print(f'  {Colors.DIM}├─{Colors.RESET} JS Modules: {Colors.CYAN}{stats.total_js_modules}{Colors.RESET}')
    print(f'  {Colors.DIM}├─{Colors.RESET} CSS Files: {Colors.MAGENTA}{stats.total_css_exports}{Colors.RESET}')
    print(f'  {Colors.DIM}└─{Colors.RESET} Total: {Colors.BRIGHT_CYAN}{stats.total_exports}{Colors.RESET}')

    print(f'\n{Colors.DIM}{"═" * 60}{Colors.RESET}\n')


def main() -> None:
    """Main entry point for the export generation script."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Generate package.json exports from dist directory.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                      # Process all packages
  %(prog)s packages/ui          # Process single package
  %(prog)s --verbose            # Show detailed output
  %(prog)s --no-color           # Disable colored output
""",
    )
    parser.add_argument(
        'path',
        nargs='?',
        default=None,
        help='Package path to process (default: all packages)',
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Show detailed output for each package',
    )
    parser.add_argument(
        '--no-color',
        action='store_true',
        help='Disable colored output',
    )

    args = parser.parse_args()

    if args.no_color:
        Colors.disable()

    script_path = Path(__file__).resolve()
    root_dir = script_path.parent.parent

    start_time = time.time()
    print_header()

    try:
        config = load_config(root_dir)
        stats = GlobalStats()

        if args.path:
            # Process single package
            package_dir = root_dir / args.path
            stats.packages_found = 1

            print(f'{Colors.DIM}Processing single package...{Colors.RESET}\n')
            pkg_stats = process_package(package_dir, root_dir, config, stats, 1, 1, args.verbose)
            stats.package_details.append(pkg_stats)
        else:
            # Process all packages
            packages_dir = root_dir / 'packages'
            print(f'{Colors.DIM}Scanning for packages with dist/ directory...{Colors.RESET}\n')

            packages = find_all_packages(packages_dir, root_dir, config)
            stats.packages_found = len(packages)

            if not packages:
                print(f'{Colors.YELLOW}⚠ No packages with dist/ directory found{Colors.RESET}')
                return

            for i, package_dir in enumerate(packages, 1):
                pkg_stats = process_package(
                    package_dir, root_dir, config, stats, i, len(packages), args.verbose
                )
                stats.package_details.append(pkg_stats)

        elapsed = time.time() - start_time
        print_summary(stats, elapsed)

        if stats.packages_errored > 0:
            sys.exit(1)

    except Exception as error:
        print(f'{Colors.YELLOW}Fatal error: {error}{Colors.RESET}')
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

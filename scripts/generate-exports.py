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

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Callable, Union, Any, Tuple
import importlib.util
import subprocess


DIST_DIR = 'dist'
PACKAGE_JSON = 'package.json'
CONFIG_FILE_JS = 'generate-exports.config.js'
CONFIG_FILE_JSON = 'generate-exports.config.json'


class ModuleFiles:
    """Represents the file structure of a module."""
    def __init__(self):
        self.js: Optional[str] = None
        self.cjs: Optional[str] = None
        self.dts: Optional[str] = None


class Module:
    """Represents a complete module with its path and associated files."""
    def __init__(self, path: str):
        self.path = path
        self.files = ModuleFiles()


def scan_directory(dir_path: Path, base_dir: Path = None) -> List[str]:
    """
    Recursively scan a directory to find all files.
    
    Args:
        dir_path: The directory to scan
        base_dir: The base directory for calculating relative paths. Defaults to dir_path.
    
    Returns:
        An array of relative file paths from the base directory
    """
    if base_dir is None:
        base_dir = dir_path
    
    files: List[str] = []
    
    try:
        for entry in dir_path.iterdir():
            if entry.is_dir():
                sub_files = scan_directory(entry, base_dir)
                files.extend(sub_files)
            elif entry.is_file():
                relative_path = entry.relative_to(base_dir)
                # Normalize path separators to forward slashes
                files.append(str(relative_path).replace('\\', '/'))
    except (PermissionError, OSError):
        pass
    
    return files


def group_files_by_module(files: List[str]) -> Dict[str, Module]:
    """
    Group files by their module name (without extension).
    
    Files are grouped by their base name, so index.js, index.cjs, and index.d.ts
    are all considered part of the same "index" module.
    
    Args:
        files: Array of file paths to group
    
    Returns:
        A dictionary of module paths to Module objects
    """
    modules: Dict[str, Module] = {}
    
    for file in files:
        # Handle .d.ts first (special case - double extension)
        if file.endswith('.d.ts'):
            ext = '.d.ts'
            module_path = file[:-5]  # Remove ".d.ts"
        else:
            ext = Path(file).suffix
            # Only process files with valid extensions
            if ext not in ['.js', '.cjs']:
                continue
            module_path = file[:-len(ext)]  # Remove extension
        
        name = Path(module_path).name
        
        # Skip if file is in a subdirectory without a filename
        if not name:
            continue
        
        key = module_path
        
        if key not in modules:
            modules[key] = Module(module_path)
        
        module = modules[key]
        
        if ext == '.js':
            module.files.js = file
        elif ext == '.cjs':
            module.files.cjs = file
        elif ext == '.d.ts':
            module.files.dts = file
    
    return modules


def is_valid_module(module: Module) -> bool:
    """
    Validate that a module has the required files.
    
    A module is considered valid if it has at least .js and .d.ts files.
    The .cjs file is optional but recommended for CommonJS support.
    
    Args:
        module: The module to validate
    
    Returns:
        True if the module is valid, False otherwise
    """
    # Must have at least .js and .d.ts files
    # .cjs is optional but recommended for CommonJS support
    return module.files.js is not None and module.files.dts is not None


def to_export_path(dist_path: str) -> str:
    """
    Convert a dist path to an export path.
    
    The root index file becomes ".", while other paths are prefixed with "./".
    
    Args:
        dist_path: The path within the dist directory
    
    Returns:
        The export path for package.json
    """
    # dist/index → "."
    if dist_path == 'index':
        return '.'
    
    # dist/loaders/cloudinary → "./loaders/cloudinary"
    return f'./{dist_path}'


def create_export_entry(
    module: Module,
    path_transform: Optional[Callable[[str], str]] = None
) -> Tuple[str, Dict[str, str]]:
    """
    Create an export entry object for a module.
    
    Args:
        module: The module to create an export entry for
        path_transform: Optional function to transform the export path
    
    Returns:
        A tuple containing (export_path, entry_dict)
    """
    export_path = to_export_path(module.path)
    
    # Apply path transformation if provided
    if path_transform:
        export_path = path_transform(export_path)
    
    dist_path = f'./dist/{module.path}'
    
    entry: Dict[str, str] = {
        'types': f'{dist_path}.d.ts'
    }
    
    if module.files.js:
        entry['import'] = f'{dist_path}.js'
    
    if module.files.cjs:
        entry['require'] = f'{dist_path}.cjs'
    
    return export_path, entry


def load_config(root_dir: Path) -> Dict[str, Any]:
    """
    Load configuration file from the root directory.
    
    Supports both .js and .json configuration files, with .js taking priority.
    If neither file exists, returns an empty configuration dictionary.
    
    Note: For .js config files, this uses Node.js to evaluate the file.
    If Node.js is not available, only .json config files are supported.
    
    Args:
        root_dir: The root directory to search for configuration files
    
    Returns:
        The loaded configuration dictionary
    """
    config_path_js = root_dir / CONFIG_FILE_JS
    config_path_json = root_dir / CONFIG_FILE_JSON
    
    # Try to load .js config first (has priority)
    if config_path_js.exists():
        try:
            # Use Node.js to evaluate the config file
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
            # If Node.js fails, try to parse as JSON (might be a .js file with JSON content)
            try:
                with open(config_path_js, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Try to extract JSON from module.exports or export default
                    # This is a simple heuristic - may not work for all cases
                    if 'module.exports' in content or 'export default' in content:
                        print('⚠️  Warning: Could not evaluate .js config file. Node.js may not be available.')
                        print('   Falling back to .json config if available.')
            except Exception:
                pass
    
    # If .js doesn't exist or failed, try .json
    if config_path_json.exists():
        try:
            with open(config_path_json, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            print(f'⚠️  Warning: Could not parse {CONFIG_FILE_JSON}: {e}')
    
    # Return default config if neither file exists
    return {}


def create_path_transform(
    config: Optional[Dict[str, Any]],
    package_path: str
) -> Optional[Callable[[str], str]]:
    """
    Create a path transformation function from configuration.
    
    Args:
        config: The path transformations configuration
        package_path: The package path to get transformation for
    
    Returns:
        A transformation function if configured, None otherwise
    """
    if not config:
        return None
    
    path_transformations = config.get('pathTransformations', {})
    transform = path_transformations.get(package_path)
    
    if not transform:
        return None
    
    remove_prefix = transform.get('removePrefix')
    if remove_prefix:
        def path_transform(export_path: str) -> str:
            if export_path.startswith(remove_prefix):
                result = export_path[len(remove_prefix):]
                # Ensure result starts with "./" (except for root entry ".")
                if result and result != '.' and not result.startswith('./'):
                    return f'./{result}'
                return result
            return export_path
        
        return path_transform
    
    return None


def scan_css_files(dist_dir: Path, base_dir: Path = None) -> List[str]:
    """
    Recursively scan for CSS files in the dist directory.
    
    Args:
        dist_dir: The dist directory to scan
        base_dir: The base directory for calculating relative paths. Defaults to dist_dir.
    
    Returns:
        An array of relative paths from dist/ (e.g., "css/amber.css", "style.css")
    """
    if base_dir is None:
        base_dir = dist_dir
    
    files: List[str] = []
    
    try:
        for entry in dist_dir.iterdir():
            if entry.is_dir():
                # Recursively scan subdirectories
                sub_files = scan_css_files(entry, base_dir)
                files.extend(sub_files)
            elif entry.is_file() and entry.name.endswith('.css'):
                # Get relative path from baseDir (dist/)
                relative_path = entry.relative_to(base_dir)
                files.append(str(relative_path).replace('\\', '/'))
    except (PermissionError, OSError):
        pass
    
    return files


def is_directory_css_only(dist_dir: Path, dir_path: str) -> bool:
    """
    Check if a directory contains only CSS files.
    
    An empty directory is considered CSS-only and will use a wildcard export.
    
    Args:
        dist_dir: The base dist directory
        dir_path: The directory path to check (relative to distDir)
    
    Returns:
        True if the directory contains only CSS files or is empty
    """
    full_path = dist_dir / dir_path
    
    try:
        entries = list(full_path.iterdir())
        
        # If directory is empty, consider it CSS-only (will use wildcard)
        if len(entries) == 0:
            return True
        
        # Check if all files in directory are CSS files
        for entry in entries:
            if entry.is_dir():
                # If there's a subdirectory, it's not CSS-only
                return False
            if entry.is_file() and not entry.name.endswith('.css'):
                # If there's a non-CSS file, it's not CSS-only
                return False
        
        return True
    except (PermissionError, OSError):
        return False


def generate_css_exports(
    dist_dir: Path,
    css_config: Union[Dict[str, Any], bool, None]
) -> Dict[str, str]:
    """
    Generate CSS exports based on auto-detected CSS files.
    
    Automatically detects CSS files in the dist directory and generates appropriate
    export paths. Supports wildcard exports for CSS-only directories and individual
    file exports when needed.
    
    Args:
        dist_dir: The dist directory to scan for CSS files
        css_config: CSS export configuration (boolean or detailed config dict)
    
    Returns:
        A dictionary of export paths to CSS file paths
    """
    css_exports: Dict[str, str] = {}
    
    # If config is boolean, use it as enabled flag
    if isinstance(css_config, bool):
        if not css_config:
            return css_exports
        css_config = {'enabled': True}
    
    if not css_config or css_config.get('enabled') is False:
        return css_exports
    
    # Auto-detect all CSS files recursively
    css_files = scan_css_files(dist_dir)
    
    if len(css_files) == 0:
        return css_exports
    
    # Add custom exports first (highest priority)
    custom_exports = css_config.get('customExports', {})
    if custom_exports:
        css_exports.update(custom_exports)
    
    # Group CSS files by directory
    css_by_dir: Dict[str, List[str]] = {}
    root_css: List[str] = []
    
    for file in css_files:
        dir_name = str(Path(file).parent)
        if dir_name == '.':
            # Root CSS files (e.g., "style.css")
            root_css.append(file)
        else:
            if dir_name not in css_by_dir:
                css_by_dir[dir_name] = []
            css_by_dir[dir_name].append(file)
    
    # Export root CSS files individually
    for file in root_css:
        export_path = f'./{file}'
        if export_path not in custom_exports:
            css_exports[export_path] = f'./dist/{file}'
    
    # Process directories
    for dir_name, files in css_by_dir.items():
        if len(files) == 0:
            continue
        
        # Check if directory contains only CSS files
        is_css_only = is_directory_css_only(dist_dir, dir_name)
        force_files = css_config.get('forceExportFiles', False)
        
        if is_css_only and not force_files:
            # Directory only contains CSS files → use wildcard
            wildcard_export = f'./{dir_name}/*'
            wildcard_path = f'./dist/{dir_name}/*'
            
            if wildcard_export not in custom_exports:
                css_exports[wildcard_export] = wildcard_path
        else:
            # Directory has mixed files or forceExportFiles is true → export individual files
            for file in files:
                export_path = f'./{file}'
                if export_path not in custom_exports:
                    css_exports[export_path] = f'./dist/{file}'
    
    return css_exports


def get_export_group(
    path: str,
    path_transform: Optional[Callable[[str], str]] = None
) -> Tuple[str, str, int]:
    """
    Extract directory group from export path for sorting purposes.
    
    Args:
        path: The export path to analyze
        path_transform: Optional path transformation function
    
    Returns:
        A tuple containing (group, subpath, sortOrder) where:
        - group: directory name or special group identifier
        - subpath: remaining path after the group
        - sortOrder: numeric order for consistent grouping
    """
    if path == '.':
        return ('.', '', 0)
    
    # Remove leading "./"
    clean_path = path[2:] if path.startswith('./') else path
    
    # Check if it's a wildcard pattern
    if clean_path.endswith('/*'):
        dir_name = clean_path[:-2]
        # CSS exports come after JS exports
        order = 900 if dir_name == 'css' else 100
        return (dir_name, '', order)
    
    # Extract first directory level
    parts = clean_path.split('/')
    if len(parts) == 1:
        # Root level file - could be transformed component or actual root file
        # If pathTransform exists, check if it removes "./components/" prefix
        # In that case, these are components and should be grouped together
        is_transformed_component = path_transform is not None
        order = 100 if is_transformed_component else 800  # Components: 100, other root files: 800
        group = 'components' if is_transformed_component else ''
        return (group, parts[0], order)
    
    group = parts[0]
    subpath = '/'.join(parts[1:])
    
    # Define sort order for known groups
    group_order: Dict[str, int] = {
        'components': 100,
        'hooks': 200,
        'primitives': 300,
        'core': 400,
        'loaders': 500,
        'utils': 600,
        'css': 900,
    }
    
    order = group_order.get(group, 700)  # Unknown groups come after known ones
    
    return (group, subpath, order)


def sort_exports(
    a: str,
    b: str,
    path_transform: Optional[Callable[[str], str]] = None
) -> int:
    """
    Sort comparator for export paths.
    
    Groups exports by directory and sorts alphabetically within each group.
    The root entry "." always comes first.
    
    Args:
        a: First export path to compare
        b: Second export path to compare
        path_transform: Optional path transformation function
    
    Returns:
        Comparison result for sorting
    """
    # "." always comes first
    if a == '.':
        return -1
    if b == '.':
        return 1
    
    group_a, subpath_a, order_a = get_export_group(a, path_transform)
    group_b, subpath_b, order_b = get_export_group(b, path_transform)
    
    # Sort by order first (groups)
    if order_a != order_b:
        return order_a - order_b
    
    # Same order, sort by group name
    if group_a != group_b:
        # Empty group (root files) comes after directories
        if group_a == '':
            return 1
        if group_b == '':
            return -1
        return -1 if group_a < group_b else 1
    
    # Same group, sort by subpath
    return -1 if subpath_a < subpath_b else 1


def generate_exports(
    dist_dir: Path,
    path_transform: Optional[Callable[[str], str]] = None,
    css_config: Union[Dict[str, Any], bool, None] = None
) -> Dict[str, Union[Dict[str, str], str]]:
    """
    Generate exports from the dist directory.
    
    This is the main function that orchestrates the entire export generation process:
    scanning files, grouping by module, validating, creating export entries, and
    optionally generating CSS exports.
    
    Args:
        dist_dir: The dist directory to scan
        path_transform: Optional function to transform export paths
        css_config: Optional CSS export configuration
    
    Returns:
        A dictionary of export paths to export entries or CSS file paths
    """
    # 1. Scan the dist directory
    files = scan_directory(dist_dir)
    
    if len(files) == 0:
        print('⚠️  No files found in dist directory')
        return {'./package.json': './package.json'}
    
    # 2. Group files by module
    modules = group_files_by_module(files)
    
    if len(modules) == 0:
        print('⚠️  No valid modules found (need .js and .d.ts files)')
        return {'./package.json': './package.json'}
    
    # 3. Filter and validate modules
    valid_modules = [m for m in modules.values() if is_valid_module(m)]
    
    if len(valid_modules) == 0:
        print('⚠️  No valid modules after validation')
        return {'./package.json': './package.json'}
    
    # 4. Create exports object
    exports: Dict[str, Dict[str, str]] = {}
    
    for module in valid_modules:
        export_path, entry = create_export_entry(module, path_transform)
        exports[export_path] = entry
    
    # 5. Sort exports by directory groups
    sorted_exports: Dict[str, Union[Dict[str, str], str]] = {}
    
    # Create a key function for sorting
    def sort_key(path: str) -> Tuple[int, str, str]:
        group, subpath, order = get_export_group(path, path_transform)
        return (order, group, subpath)
    
    export_keys = sorted(exports.keys(), key=lambda x: sort_key(x))
    
    for key in export_keys:
        sorted_exports[key] = exports[key]
    
    # 6. Auto-detect and generate CSS exports
    css_exports_to_add: Dict[str, str] = {}
    if css_config is not None:
        # Use provided config
        css_exports_to_add = generate_css_exports(dist_dir, css_config)
    else:
        # Auto-detect: scan for all CSS files and generate exports
        css_files = scan_css_files(dist_dir)
        
        if len(css_files) > 0:
            # Auto-add CSS exports with defaults
            css_exports_to_add = generate_css_exports(dist_dir, {'enabled': True})
    
    # Merge CSS exports and re-sort
    sorted_exports.update(css_exports_to_add)
    
    # Re-sort after adding CSS exports to maintain group order
    all_keys = sorted(sorted_exports.keys(), key=lambda x: sort_key(x))
    
    # Rebuild sorted exports
    final_sorted_exports: Dict[str, Union[Dict[str, str], str]] = {}
    for key in all_keys:
        final_sorted_exports[key] = sorted_exports[key]
    
    # 7. Always add package.json export at the end
    final_sorted_exports['./package.json'] = './package.json'
    
    return final_sorted_exports


def update_package_json(
    package_json_path: Path,
    new_exports: Dict[str, Union[Dict[str, str], str]]
) -> Dict[str, Any]:
    """
    Update package.json with new exports.
    
    Reads the existing package.json, merges the new exports (preserving other fields),
    and writes the file back with proper formatting.
    
    Args:
        package_json_path: Path to the package.json file
        new_exports: The new exports to merge into package.json
    
    Returns:
        The updated package.json dictionary
    """
    with open(package_json_path, 'r', encoding='utf-8') as f:
        package_json = json.load(f)
    
    # Merge new exports
    package_json['exports'] = new_exports
    
    # Write back with formatting
    with open(package_json_path, 'w', encoding='utf-8') as f:
        json.dump(package_json, f, indent=2, ensure_ascii=False)
        f.write('\n')
    
    return package_json


def process_package(
    package_dir: Path,
    root_dir: Path,
    config: Dict[str, Any]
) -> None:
    """
    Process a single package to generate and update its exports.
    
    Validates the package structure, applies configuration, generates exports,
    and updates the package.json file.
    
    Args:
        package_dir: The directory of the package to process
        root_dir: The root directory of the workspace
        config: The configuration dictionary
    """
    dist_dir = package_dir / DIST_DIR
    package_json_path = package_dir / PACKAGE_JSON
    
    # Get relative path from root for config matching
    try:
        relative_path = str(package_dir.relative_to(root_dir)).replace('\\', '/')
    except ValueError:
        # If paths are on different drives (Windows), use absolute path
        relative_path = str(package_dir)
    
    # Check if package should be skipped
    skip_packages = config.get('skipPackages', [])
    if relative_path in skip_packages:
        print(f'⏭️  Skipping {package_dir.name} (configured to skip)')
        return
    
    # Validate paths
    if not package_json_path.exists() or not dist_dir.exists():
        print(f'⚠️  Skipping {package_dir}: package.json or dist/ not found')
        return
    
    try:
        with open(package_json_path, 'r', encoding='utf-8') as f:
            package_json = json.load(f)
        
        package_name = package_json.get('name', package_dir.name)
        
        # Get path transformation for this package
        path_transform = create_path_transform(config, relative_path)
        
        # Get CSS export config for this package
        css_exports_config = config.get('cssExports', {})
        css_config = css_exports_config.get(relative_path) if css_exports_config else None
        
        print(f'\n📦 Processing package: {package_name}')
        print(f'📁 Package directory: {package_dir}')
        if path_transform:
            print('🔧 Using custom path transformation')
        if css_config is not None:
            if css_config is False:
                print('🚫 CSS exports disabled')
            else:
                print('🎨 CSS exports configured')
        print('🔍 Scanning dist directory...')
        
        exports = generate_exports(dist_dir, path_transform, css_config)
        
        print(f'✅ Found {len(exports)} export entries')
        print('📝 Updating package.json...')
        
        update_package_json(package_json_path, exports)
        
        print('✨ Done! package.json exports updated.')
    except Exception as error:
        print(f'❌ Error processing {package_dir}: {error}')
        import traceback
        traceback.print_exc()
        raise


def find_all_packages(
    packages_dir: Path,
    root_dir: Path,
    config: Dict[str, Any]
) -> List[Path]:
    """
    Find all packages with a dist/ directory.
    
    Scans the packages directory and returns all packages that have both
    a package.json file and a dist/ directory, excluding packages configured
    to be skipped.
    
    Args:
        packages_dir: The directory containing packages
        root_dir: The root directory of the workspace
        config: The configuration dictionary
    
    Returns:
        An array of package directory paths
    """
    packages: List[Path] = []
    skip_packages = config.get('skipPackages', [])
    
    try:
        for entry in packages_dir.iterdir():
            if not entry.is_dir():
                continue
            
            try:
                relative_path = str(entry.relative_to(root_dir)).replace('\\', '/')
            except ValueError:
                relative_path = str(entry)
            
            # Skip packages in config
            if relative_path in skip_packages:
                continue
            
            dist_path = entry / DIST_DIR
            package_json_path = entry / PACKAGE_JSON
            
            # Check if package has both package.json and dist/
            if package_json_path.exists() and dist_path.exists():
                packages.append(entry)
    except (PermissionError, OSError) as error:
        print(f'❌ Error scanning packages directory: {error}')
    
    return packages


def main() -> None:
    """Main entry point for the export generation script."""
    # Get workspace root (parent of scripts directory)
    script_path = Path(__file__).resolve()
    scripts_dir = script_path.parent
    root_dir = scripts_dir.parent
    
    args = sys.argv[1:]
    
    try:
        # Load configuration
        config = load_config(root_dir)
        
        if len(args) > 0:
            # Process single package
            package_dir = root_dir / args[0]
            process_package(package_dir, root_dir, config)
        else:
            # Process all packages
            packages_dir = root_dir / 'packages'
            print('🔍 Scanning for packages with dist/ directory...')
            
            packages = find_all_packages(packages_dir, root_dir, config)
            
            if len(packages) == 0:
                print('⚠️  No packages with dist/ directory found')
                return
            
            print(f'\n📦 Found {len(packages)} package(s) to process:\n')
            for pkg in packages:
                print(f'  - {pkg.name}')
            
            success_count = 0
            error_count = 0
            
            for package_dir in packages:
                try:
                    process_package(package_dir, root_dir, config)
                    success_count += 1
                except Exception:
                    error_count += 1
            
            print(f'\n📊 Summary:')
            print(f'  ✅ Success: {success_count}')
            if error_count > 0:
                print(f'  ❌ Errors: {error_count}')
    except Exception as error:
        print(f'❌ Error: {error}')
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()


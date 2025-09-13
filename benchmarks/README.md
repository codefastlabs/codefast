# Benchmarks

This directory contains performance benchmarks for packages in the CodeFast monorepo. Each package has its own dedicated benchmark suite to ensure optimal performance and identify potential regressions.

## Structure

```text
benchmarks/
├── README.md                    # This file
└── tailwind-variants/           # Benchmarks for @codefast/tailwind-variants
    ├── README.md                # Package-specific benchmark documentation
    ├── package.json             # Benchmark package configuration
    ├── tsconfig.json            # TypeScript configuration
    ├── eslint.config.js         # ESLint configuration
    └── src/                     # Benchmark source code
        ├── configs.ts           # Benchmark configurations
        ├── utils.ts             # Performance utilities
        ├── suites.ts            # Individual benchmark suites
        ├── analyzer.ts          # Result analysis
        └── index.ts             # Main benchmark runner
```

## Available Benchmarks

### Tailwind Variants (`tailwind-variants/`)

Comprehensive performance benchmarks for the `@codefast/tailwind-variants` package, comparing it against:

- `tailwind-variants` (npm package)
- `class-variance-authority`
- `CVA + tailwind-merge`

**Benchmark Scenarios:**
- Basic variants
- Compound variants
- Slots
- Large datasets
- Complex components
- Real-world usage patterns
- Class property support (Vue/Svelte style)
- Mixed properties

**Usage:**
```bash
cd benchmarks/tailwind-variants
pnpm benchmark                    # Run all benchmarks
pnpm benchmark:basic             # Run specific benchmark
```

## Design Principles

This benchmark structure follows SOLID, KISS, and DRY principles:

### SOLID (Single Responsibility Principle)
- Each benchmark package focuses solely on performance testing
- Clear separation between benchmark code and production code
- Independent benchmark packages that don't interfere with main packages

### KISS (Keep It Simple, Stupid)
- Simple, straightforward benchmark structure
- Easy to understand and maintain
- Minimal dependencies and complexity

### DRY (Don't Repeat Yourself)
- Shared utilities and configurations
- Reusable benchmark patterns
- Consistent structure across all benchmark packages

## Benefits

1. **Separation of Concerns**: Benchmarks are isolated from production code
2. **Easy Maintenance**: Independent packages that can be updated without affecting main packages
3. **Scalability**: Easy to add new benchmark packages for other packages
4. **Clean Dependencies**: Benchmark-specific dependencies don't pollute main packages
5. **Version Control**: Independent versioning and release cycles
6. **CI/CD Integration**: Can be run independently in CI/CD pipelines

## Adding New Benchmarks

To add benchmarks for a new package:

1. Create a new directory: `benchmarks/package-name/`
2. Follow the same structure as `tailwind-variants/`
3. Update this README to include the new benchmark
4. Ensure proper TypeScript configuration and dependencies

## Running Benchmarks

Each benchmark package has its own scripts and can be run independently:

```bash
# Navigate to specific benchmark package
cd benchmarks/package-name

# Install dependencies
pnpm install

# Run benchmarks
pnpm benchmark
```

## Performance Guidelines

- Run benchmarks multiple times for statistical accuracy
- Monitor memory usage for large datasets
- Compare results across different environments
- Document performance regressions
- Set appropriate thresholds for CI/CD
- Test both simple and complex scenarios
- Include real-world component patterns

## Contributing

When adding new benchmarks:

1. Follow the existing structure and patterns
2. Add proper TypeScript types
3. Include comprehensive documentation
4. Test thoroughly
5. Update relevant README files
6. Focus on real-world scenarios
7. Test various complexity levels

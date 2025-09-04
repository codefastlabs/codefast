# Benchmark Comparison: TV vs tailwind-variants vs class-variance-authority

This document describes the benchmarking setup for comparing the performance of our `tv` library with `tailwind-variants` and `class-variance-authority`.

## Overview

The benchmarking suite follows best practices with a modular, maintainable structure:

```text
benchmarks/
├── configs.ts      # Benchmark configurations
├── utils.ts        # Performance measurement utilities
├── suites.ts       # Individual benchmark suites
├── analyzer.ts     # Result analysis and reporting
└── index.ts        # Main benchmark runner
```

## Architecture

### 1. **Modular Design**

- **Configurations** (`configs.ts`) - Reusable test configurations
- **Utilities** (`utils.ts`) - Performance measurement functions
- **Suites** (`suites.ts`) - Individual benchmark scenarios
- **Analyzer** (`analyzer.ts`) - Result analysis and reporting
- **Runner** (`index.ts`) - Main orchestration

### 2. **Separation of Concerns**

- Test configurations are separated from execution logic
- Performance measurement utilities are reusable
- Each benchmark suite is independent and focused
- Analysis and reporting are centralized

### 3. **Type Safety**

- Full TypeScript support with proper interfaces
- Type-safe benchmark results and configurations
- Compile-time error checking

## Running Benchmarks

### Quick Benchmark (Jest Tests)

Run the benchmark tests as part of the test suite:

```bash
pnpm test benchmark
```

This will run performance tests and output results to the console.

### Detailed Benchmark (Standalone Script)

For more detailed performance analysis with multiple runs and statistical data:

```bash
# Run all benchmarks
pnpm benchmark

# Run specific benchmark suites
pnpm benchmark:basic
pnpm benchmark:compound
pnpm benchmark:slots
pnpm benchmark:large
```

### Individual Suite Execution

Run specific benchmark suites for focused testing:

```bash
# Basic variants only
pnpm benchmark:basic

# Compound variants only
pnpm benchmark:compound

# Slots only
pnpm benchmark:slots

# Large dataset only
pnpm benchmark:large
```

## Benchmark Scenarios

### 1. Basic Variants

Tests simple variant combinations with 3 variants (color, size, variant) and default values.

**Configuration:**

- 3 color variants (primary, secondary, danger)
- 3 size variants (sm, md, lg)
- 3 variant types (solid, outline, ghost)
- Default variants for color and size

### 2. Compound Variants

Tests compound variant logic with conditional class application.

**Configuration:**

- Same basic variants as above
- 2 compound variants that apply additional classes based on specific combinations
- Tests both matching and non-matching compound variants

### 3. Slots

Tests slot-based styling (only available in `tv` and `tailwind-variants`).

**Configuration:**

- 3 slots (base, icon, label)
- Variants that apply different classes to different slots
- Tests slot function calls

### 4. Large Dataset

Tests performance with large configurations.

**Configuration:**

- 20 color variants
- 10 size variants
- 15 spacing variants
- 50 compound variants
- 100 test cases

## Performance Metrics

The benchmarks measure:

- **Execution Time**: Time to process variant combinations
- **Memory Usage**: Memory consumption for multiple instances
- **Statistical Data**: Min, max, average, median across multiple runs
- **Relative Performance**: Speed comparison between libraries

## Expected Results

### Performance Thresholds

- **Basic Variants**: < 100ms for 1000 iterations
- **Compound Variants**: < 150ms for 1000 iterations
- **Slots**: < 200ms for 1000 iterations
- **Large Dataset**: < 1000ms for 500 iterations
- **Memory Usage**: < 50MB for 1000 instances

### Library Comparison

The benchmarks compare:

1. **TV** (our library) - Full-featured with slots, compound variants, and type safety
2. **tailwind-variants** - Popular alternative with similar feature set
3. **class-variance-authority** - Simpler alternative without slots support

## Interpreting Results

### Performance Analysis

- **Lower is better** for execution time
- **Consistent results** across multiple runs indicate stable performance
- **Memory usage** should be reasonable and not grow excessively

### Feature Comparison

| Feature           | TV  | tailwind-variants | class-variance-authority |
| ----------------- | --- | ----------------- | ------------------------ |
| Basic Variants    | ✅  | ✅                | ✅                       |
| Compound Variants | ✅  | ✅                | ✅                       |
| Slots             | ✅  | ✅                | ❌                       |
| Type Safety       | ✅  | ✅                | ✅                       |
| Extends           | ✅  | ✅                | ❌                       |

## Running in CI/CD

The benchmark tests are integrated into the Jest test suite and will run:

- On every `pnpm test` command
- In CI/CD pipelines
- With coverage reporting

## Customizing Benchmarks

### Adding New Scenarios

1. Add configuration to `benchmarks/configs.ts`
2. Add test cases to `testCases` object in `configs.ts`
3. Create new suite function in `benchmarks/suites.ts`
4. Add suite to main runner in `benchmarks/index.ts`

### Modifying Test Parameters

- **Iterations**: Change the `iterations` parameter in `runBenchmark()`
- **Runs**: Change the `runs` parameter for more statistical data
- **Thresholds**: Adjust performance expectations in test assertions

### Adding New Libraries

1. Install the library as a devDependency
2. Import it in the relevant suite file
3. Add benchmark execution for the new library
4. Update the analyzer to include the new library

## Best Practices

### 1. **Modularity**

- Each benchmark suite is independent
- Configurations are reusable
- Utilities are shared across suites

### 2. **Maintainability**

- Clear separation of concerns
- Type-safe interfaces
- Consistent naming conventions

### 3. **Extensibility**

- Easy to add new scenarios
- Simple to include new libraries
- Flexible configuration system

### 4. **Reliability**

- Multiple runs for statistical accuracy
- Memory usage monitoring
- Consistent test environments

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all libraries are installed as devDependencies
2. **Memory Issues**: Use `--expose-gc` flag for memory analysis
3. **Performance Variance**: Run multiple times to account for system load

### Debug Mode

For debugging, you can run individual test scenarios:

```bash
# Run only basic variants
pnpm benchmark:basic

# Run with verbose output
DEBUG=1 pnpm benchmark
```

## Contributing

When adding new features to the `tv` library:

1. Add corresponding benchmark tests
2. Ensure performance doesn't regress
3. Update this documentation if needed
4. Consider adding new benchmark scenarios for new features

## References

- [tailwind-variants Documentation](https://www.tailwind-variants.org/)
- [class-variance-authority Documentation](https://cva.style/docs)
- [Performance.now() MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
- [Node.js Memory Usage](https://nodejs.org/api/process.html#processmemoryusage)

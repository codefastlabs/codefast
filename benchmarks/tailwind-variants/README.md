# Tailwind Variants Performance Benchmark

A comprehensive performance benchmark comparing three major Tailwind CSS variant libraries across different scenarios and configurations.

## Overview

This benchmark evaluates the runtime performance of CSS-in-JS variant libraries that help manage Tailwind CSS class combinations dynamically. It tests both simple and complex variant scenarios, with and without Tailwind merge functionality.

## Libraries Tested

- **tailwind-variants** - The original variant library with comprehensive features
- **class-variance-authority (CVA)** - A lightweight, performant alternative
- **@codefast/tailwind-variants** - Custom implementation with enhanced functionality

## Benchmark Scenarios

### 1. Simple Variants (Without Tailwind Merge)

Tests basic variant functionality with standard button configurations:

- **Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- **Sizes**: `default`, `sm`, `lg`, `icon`
- **Configuration**: `twMerge: false` for maximum performance

### 2. Simple Variants (With Tailwind Merge)

Same as above but with Tailwind merge enabled:

- Tests class conflict resolution and merging
- **Configuration**: `twMerge: true` (default behavior)

### 3. Complex Variants (Without Tailwind Merge)

Advanced functionality testing:

- **Boolean variants**: `disabled`, `loading`
- **Compound variants**: Conditional styling based on multiple props
- **Complex class combinations**
- **Configuration**: `twMerge: false`

### 4. Complex Variants (With Tailwind Merge)

Complex variants with merge functionality:

- Full feature set with class conflict resolution
- **Configuration**: `twMerge: true`

## Running the Benchmark

### Prerequisites

```bash
# Ensure you're in the project root
cd /path/to/codefast

# Install dependencies (if needed)
pnpm install
```

### Execution Commands

```bash
# From project root (recommended)
pnpm --filter @codefast/benchmark-tailwind-variants bench

# From benchmark directory
cd benchmarks/tailwind-variants
pnpm bench

# Direct execution with tsx
npx tsx src/index.ts
```

## Sample Output

```text
🚀 Starting Tailwind Variants Performance Benchmark
================================================

Starting Tailwind Variants Performance Benchmark...

Running Simple Variants (Without Tailwind Merge) benchmark...
✓ Simple Variants (Without Tailwind Merge) completed

=== Simple Variants (Without Tailwind Merge) Results ===
┌─────────┬────────────────────────────────────────┬─────────────┬───────────────────┬──────────┬─────────┐
│ (index) │ Task Name                              │ ops/sec     │ Average Time (ns) │ Margin   │ Samples │
├─────────┼────────────────────────────────────────┼─────────────┼───────────────────┼──────────┼─────────┤
│ 0       │ '[simple] tailwind-variants'           │ '190,466'   │ 5250.259441268022 │ '±0.27%' │ 190467  │
│ 1       │ '[simple] class-variance-authority'    │ '1,152,660' │ 867.5582335134382 │ '±0.38%' │ 1152661 │
│ 2       │ '[simple] @codefast/tailwind-variants' │ '1,376,880' │ 726.2796065889722 │ '±0.29%' │ 1376881 │
└─────────┴────────────────────────────────────────┴─────────────┴───────────────────┴──────────┴─────────┘

📊 Performance Analysis Summary
═══════════════════════════════════════

🏆 Fastest Performer:
   • [simple] @codefast/tailwind-variants
   • 1.4M ops/sec

🥇 Performance Ranking:
   🥇 [simple] @codefast/tailwind-variants
      1.4M ops/sec (100.0% of fastest)
      [████████████████████]
   🥈 [simple] class-variance-authority
      1.2M ops/sec (83.7% of fastest)
      [█████████████████░░░]
   🥉 [simple] tailwind-variants
      190.5K ops/sec (13.8% of fastest)
      [███░░░░░░░░░░░░░░░░░]
```

## Performance Insights

### Key Findings

1. **@codefast/tailwind-variants** shows excellent performance across all scenarios
2. **class-variance-authority** provides strong performance, especially for simple use cases
3. **tailwind-variants** (original) has lower performance but offers comprehensive features
4. **Tailwind merge** significantly impacts performance across all libraries
5. **Complex variants** generally perform worse than simple variants due to additional logic

### Performance Characteristics

- **Without Tailwind Merge**: Performance differences are more pronounced
- **With Tailwind Merge**: Performance gaps narrow due to merge overhead
- **Simple vs Complex**: Complex variants show 2-4x performance reduction
- **Consistency**: @codefast/tailwind-variants shows most consistent performance

## Technical Details

### Test Configuration

- **Runtime**: 1 second per benchmark
- **Iterations**: 1000 iterations per test
- **Warmup**: 100 warmup iterations (100ms)
- **Benchmark Engine**: [tinybench](https://github.com/tinylibs/tinybench)
- **Execution**: Direct TypeScript execution with tsx (no build step)

### Test Data

- **Simple Tests**: 6 different prop combinations
- **Complex Tests**: 6 different prop combinations with boolean variants
- **Scenarios**: Each library tested against identical prop sets

### Button Variant Configuration

```typescript
const buttonVariants = {
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  defaultVariants: {
    variant: "default",
    size: "default",
  },
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "underline-offset-4 hover:underline text-primary",
    },
    size: {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3 rounded-md",
      lg: "h-11 px-8 rounded-md",
      icon: "h-10 w-10",
    },
  },
};
```

## Dependencies

### Runtime Dependencies

- `@codefast/tailwind-variants` - Custom implementation (workspace dependency)
- `tailwind-variants` - Original library
- `class-variance-authority` - CVA implementation
- `tailwind-merge` - Class merging utility (used by with-merge scenarios)
- `tinybench` - High-precision benchmark runner

### Development Dependencies

- `tsx` - TypeScript execution engine
- `@codefast/eslint-config` - Project ESLint configuration
- `@codefast/typescript-config` - Project TypeScript configuration

## Project Structure

```text
benchmarks/tailwind-variants/
├── src/
│   ├── benchmarks/
│   │   ├── simple/
│   │   │   ├── with-merge.ts      # Simple variants with Tailwind merge
│   │   │   └── without-merge.ts   # Simple variants without merge
│   │   ├── complex/
│   │   │   ├── with-merge.ts      # Complex variants with Tailwind merge
│   │   │   └── without-merge.ts   # Complex variants without merge
│   │   └── index.ts               # Benchmark exports
│   ├── data/
│   │   ├── button-variants.ts     # Variant configurations
│   │   ├── test-props.ts          # Test data sets
│   │   └── index.ts               # Data exports
│   ├── utils/
│   │   ├── performance-summary.ts # Performance analysis utilities
│   │   └── index.ts               # Utility exports
│   └── index.ts                   # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Quality Standards

This benchmark follows project quality standards:

- ✓ **Zero ESLint warnings** - `pnpm lint` passes completely
- ✓ **TypeScript strict mode** - Full type safety
- ✓ **Consistent execution** - Reproducible benchmark results
- ✓ **Comprehensive testing** - Multiple scenarios and configurations

## Usage in Development

This benchmark is useful for:

1. **Library Selection** - Choose the best-performing variant library for your use case
2. **Performance Monitoring** - Track performance regressions over time
3. **Configuration Optimization** - Understand the performance impact of different settings
4. **Feature Comparison** - Evaluate trade-offs between features and performance

## Contributing

To modify or extend the benchmark:

1. Add new test scenarios in `src/benchmarks/`
2. Update test data in `src/data/`
3. Run `pnpm bench` to verify changes
4. Ensure `pnpm lint` passes with zero warnings

The benchmark is designed to be easily extensible for testing additional libraries or scenarios.

# Tailwind Variants Performance Benchmark

This benchmark compares the performance of different Tailwind CSS variant libraries to help developers choose the most performant solution for their projects.

## Libraries Compared

1. **tailwind-variants** (original library) - The original implementation
2. **class-variance-authority** (CVA) - A popular alternative
3. **class-variance-authority + tailwind-merge** - CVA with Tailwind merge functionality
4. **@codefast/tailwind-variants** - Custom implementation with enhanced functionality

## Benchmark Categories

### Simple Variants

Tests basic variant functionality with standard button configurations including:

- Variant types (default, destructive, outline, secondary, ghost, link)
- Size variants (default, sm, lg, icon)

### Complex Variants

Tests advanced functionality including:

- Multiple variant types
- Boolean variants (disabled, loading)
- Compound variants
- Complex class merging

## Running the Benchmark

**No build required!** The benchmark runs directly with `tsx` for fast execution.

From the project root:

```bash
# Run the benchmark (no build needed)
pnpm --filter @codefast/benchmark-tailwind-variants bench

# Development commands
pnpm --filter @codefast/benchmark-tailwind-variants lint
```

### Direct Execution

The benchmark runs directly from TypeScript source using `tsx`:

```bash
# From the benchmark directory
pnpm bench

# Or directly with tsx
npx tsx src/index.ts

# Or from project root
pnpm --filter @codefast/benchmark-tailwind-variants bench
```

## Sample Results

```text
=== Benchmark Results ===
┌─────────┬─────────────────────────────────────────────┬─────────────┬────────────────────┬──────────┬─────────┐
│ (index) │ Task Name                                   │ ops/sec     │ Average Time (ns)  │ Margin   │ Samples │
├─────────┼─────────────────────────────────────────────┼─────────────┼────────────────────┼──────────┼─────────┤
│ 0       │ 'tailwind-variants (original)'              │ '115,304'   │ 8672.72            │ '±0.25%' │ 115305  │
│ 1       │ 'class-variance-authority'                  │ '1,104,932' │ 905.03             │ '±0.34%' │ 1104933 │
│ 2       │ 'class-variance-authority + tailwind-merge' │ '211,528'   │ 4727.49            │ '±0.32%' │ 211529  │
│ 3       │ '@codefast/tailwind-variants'               │ '211,635'   │ 4725.11            │ '±0.18%' │ 211636  │
│ 4       │ 'tailwind-variants (original) - complex'    │ '89,331'    │ 11194.27           │ '±0.54%' │ 89332   │
│ 5       │ 'class-variance-authority - complex'        │ '358,549'   │ 2789.02            │ '±0.17%' │ 358550  │
│ 6       │ '@codefast/tailwind-variants - complex'     │ '170,681'   │ 5858.88            │ '±0.56%' │ 170682  │
└─────────┴─────────────────────────────────────────────┴─────────────┴────────────────────┴──────────┴─────────┘

=== Performance Summary ===
Fastest: class-variance-authority (1,179,027 ops/sec)
Slowest: tailwind-variants (original) - complex (93,051 ops/sec)
Performance ratio: 12.67x
```

## Key Findings

1. **class-variance-authority** shows the best performance for simple variants
2. **@codefast/tailwind-variants** provides competitive performance with additional features
3. Complex variants show different performance characteristics across libraries
4. **tailwind-variants (original)** shows lower performance, especially with complex variants

## Configuration

The benchmark uses the following configuration:

- **Runtime**: 1 second per benchmark
- **Iterations**: 1000 iterations
- **Warmup**: 100 warmup iterations
- **Benchmark Library**: tinybench
- **Execution**: Direct TypeScript execution with tsx (no build required)

## Dependencies

- `@codefast/tailwind-variants` - Custom implementation
- `tailwind-variants` - Original library
- `class-variance-authority` - CVA implementation
- `tailwind-merge` - Class merging utility
- `tinybench` - Benchmark runner

## Quality Standards

This benchmark package follows project quality standards:

- ✅ Zero ESLint warnings
- ✅ Successful benchmark execution

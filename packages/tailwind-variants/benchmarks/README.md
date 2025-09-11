# Benchmarks

This directory contains the comprehensive benchmark suite for comparing TV library performance with other similar libraries across various real-world scenarios.

## Structure

```text
benchmarks/
├── README.md       # This file
├── configs.ts      # Benchmark configurations and test cases
├── utils.ts        # Performance measurement utilities
├── suites.ts       # Individual benchmark suites
├── analyzer.ts     # Result analysis and reporting
└── index.ts        # Main benchmark runner
```

## Files Overview

### `configs.ts`

Contains all benchmark configurations and test cases:

- `benchmarkConfigs` - Reusable test configurations for different scenarios
- `testCases` - Test data for each benchmark scenario

**Available Benchmark Scenarios:**

1. **Basic Variants** - Simple variant combinations
2. **Compound Variants** - Complex variant interactions
3. **Slots** - Multi-slot component scenarios
4. **Large Dataset** - High-volume variant processing
5. **Complex Button** - Real-world button component with multiple variants
6. **Advanced Card** - Card component with slots and complex styling
7. **Responsive Layout** - Layout system with responsive variants
8. **Form Components** - Form elements with validation states
9. **Data Table** - Table component with sorting and selection
10. **Real-world Components** - Complex component system with 16+ slots

**Class Property Benchmarks (Vue/Svelte Style):**

11. **Class Property** - Basic variants using `class` property instead of `className`
12. **Class Compound** - Compound variants using `class` property
13. **Class Slots** - Slots using `class` property
14. **Mixed Properties** - Mixed usage of both `className` and `class` properties

### `utils.ts`

Performance measurement utilities:

- `measureExecutionTime()` - Measure execution time of a function
- `runBenchmark()` - Run benchmark with multiple iterations
- `calculateSpeedup()` - Calculate relative performance
- `measureMemoryUsage()` - Measure memory consumption

### `suites.ts`

Individual benchmark suites:

- `runBasicVariantsBenchmark()` - Basic variants performance
- `runCompoundVariantsBenchmark()` - Compound variants performance
- `runSlotsBenchmark()` - Slots performance
- `runLargeDatasetBenchmark()` - Large dataset performance
- `runComplexButtonBenchmark()` - Complex button component performance
- `runAdvancedCardBenchmark()` - Advanced card component performance
- `runResponsiveLayoutBenchmark()` - Responsive layout performance
- `runFormComponentsBenchmark()` - Form components performance
- `runDataTableBenchmark()` - Data table performance

- `runRealWorldComponentsBenchmark()` - Real-world components performance
- `runClassPropertyBenchmark()` - Class property performance (Vue/Svelte style)
- `runClassCompoundVariantsBenchmark()` - Class compound variants performance
- `runClassSlotsBenchmark()` - Class slots performance
- `runMixedPropertiesBenchmark()` - Mixed className/class properties performance

### `analyzer.ts`

Result analysis and reporting:

- `analyzeResults()` - Display comprehensive performance summary
- `generateReport()` - Generate detailed markdown report
- `exportResults()` - Export results to JSON

### `index.ts`

Main benchmark runner:

- `runBenchmarks()` - Run all benchmark suites
- `runSpecificBenchmark()` - Run specific benchmark suite

## Usage

### Run All Benchmarks

```bash
pnpm benchmark
```

### Run Specific Benchmark

```bash
pnpm benchmark:basic
pnpm benchmark:compound
pnpm benchmark:slots
pnpm benchmark:large
pnpm benchmark:complexButton
pnpm benchmark:advancedCard
pnpm benchmark:responsiveLayout
pnpm benchmark:formComponents
pnpm benchmark:dataTable

pnpm benchmark:realWorldComponents
pnpm benchmark:classProperty
pnpm benchmark:classCompound
pnpm benchmark:classSlots
pnpm benchmark:mixedProperties
```

### Run Individual Suite

```bash
tsx benchmarks/index.ts basic
tsx benchmarks/index.ts compound
tsx benchmarks/index.ts slots
tsx benchmarks/index.ts large
tsx benchmarks/index.ts complexButton
tsx benchmarks/index.ts advancedCard
tsx benchmarks/index.ts responsiveLayout
tsx benchmarks/index.ts formComponents
tsx benchmarks/index.ts dataTable

tsx benchmarks/index.ts realWorldComponents
tsx benchmarks/index.ts classProperty
tsx benchmarks/index.ts classCompound
tsx benchmarks/index.ts classSlots
tsx benchmarks/index.ts mixedProperties
```

## Benchmark Scenarios

### 1. Basic Variants

Simple variant combinations with 3-4 variants and basic styling.

### 2. Compound Variants

Complex variant interactions with compound variant logic.

### 3. Slots

Multi-slot component scenarios testing slot resolution performance.

### 4. Large Dataset

Complex button component with multiple variants and compound logic:

- 6 variants (default, destructive, outline, secondary, ghost, link, gradient, glass)
- 5 sizes (sm, default, lg, xl, icon)
- 6 colors (primary, secondary, success, warning, error, info)
- 3 themes (light, dark, auto)
- 2 boolean states (loading, disabled)
- 10 compound variants

### 5. Complex Button

Real-world button component with:

- 7 variants (default, destructive, outline, secondary, ghost, link, gradient, glass)
- 5 sizes (sm, default, lg, xl, icon)
- 6 colors (primary, secondary, success, warning, error, info)
- 2 boolean states (loading, disabled)
- 5 compound variants

### 6. Advanced Card

Card component with slots and complex styling:

- 5 variants (default, elevated, bordered, minimal, glass)
- 3 sizes (sm, default, lg)
- 2 boolean states (interactive, elevated)
- 5 slots (header, title, description, content, footer, actions)
- 3 compound variants

### 7. Responsive Layout

Layout system with responsive variants:

- 4 layout types (default, centered, fullscreen, sidebar)
- 3 sidebar states (expanded, collapsed, hidden)
- 3 themes (light, dark, auto)
- 2 responsive modes (true, false)
- 8 slots (header, sidebar, main, content, footer, navigation, mobileMenu)
- 3 compound variants

### 8. Form Components

Form elements with validation states:

- 3 sizes (sm, default, lg)
- 4 variants (default, filled, outlined, minimal)
- 4 states (default, error, success, warning)
- 2 boolean states (required)
- 10 slots (field, label, input, textarea, select, checkbox, radio, error, help)
- 3 compound variants

### 9. Data Table

Table component with sorting and selection:

- 4 variants (default, bordered, striped, minimal, elevated)
- 3 sizes (sm, default, lg)
- 4 boolean states (striped, hoverable, selectable, sortable)
- 13 slots (container, header, table, thead, tbody, tr, th, td, footer, pagination, search, filters)
- 3 compound variants

### 10. Real-world Components

Complex component system:

- 6 variants (default, elevated, outlined, filled, ghost, gradient, glass)
- 5 sizes (xs, sm, default, lg, xl)
- 6 colors (primary, secondary, success, warning, error, info)
- 3 themes (light, dark, auto)
- 3 boolean states (interactive, disabled, loading)
- 16 slots (container, header, content, footer, actions, icon, label, description, badge, avatar, menu, dropdown, modal, drawer, tooltip, popover)
- 6 compound variants

### 11. Class Property

Basic variants using `class` property (Vue/Svelte style):

- 3 variants (default, outline, solid)
- 3 colors (primary, secondary, danger)
- 3 sizes (sm, md, lg)

### 12. Class Compound

Compound variants using `class` property:

- 3 colors (primary, secondary, danger)
- 3 sizes (sm, md, lg)
- 2 compound variants with `class` property

### 13. Class Slots

Slots using `class` property:

- 2 colors (primary, secondary)
- 2 sizes (sm, lg)
- 3 slots (base, icon, label)

### 14. Mixed Properties

Mixed usage of both `className` and `class` properties:

- 3 colors (primary, secondary, danger)
- 3 sizes (sm, md, lg)
- 3 variants (default, outline, solid)
- 2 compound variants (one with `className`, one with `class`)
- Test cases mixing both properties

## Adding New Benchmarks

### 1. Add Configuration

In `configs.ts`, add new configuration:

```typescript
export const benchmarkConfigs = {
  // ... existing configs
  newScenario: {
    base: "base-class",
    variants: {
      // ... variant configuration
    },
  },
};
```

### 2. Add Test Cases

In `configs.ts`, add test cases:

```typescript
export const testCases = {
  // ... existing test cases
  newScenario: [
    // ... test cases
  ],
};
```

### 3. Create Suite

In `suites.ts`, add new suite function:

```typescript
export const runNewScenarioBenchmark = (): Record<string, BenchmarkResult> => {
  // ... benchmark implementation
};
```

### 4. Add to Runner

In `index.ts`, add to main runner and specific runner:

```typescript
// In runBenchmarks()
const newScenarioResults = runNewScenarioBenchmark();

// In runSpecificBenchmark()
case "newScenario":
  runNewScenarioBenchmark();
  break;
```

### 5. Update Analyzer

In `analyzer.ts`, update interfaces and analysis:

```typescript
export interface BenchmarkResults {
  // ... existing properties
  newScenario: Record<string, BenchmarkResult>;
}
```

## Best Practices

1. **Modularity**: Keep each benchmark suite independent
2. **Reusability**: Share configurations and utilities
3. **Type Safety**: Use proper TypeScript interfaces
4. **Consistency**: Follow naming conventions
5. **Documentation**: Document new benchmarks
6. **Real-world Scenarios**: Focus on practical use cases
7. **Comprehensive Testing**: Test various complexity levels

## Performance Guidelines

- Run benchmarks multiple times for statistical accuracy
- Monitor memory usage for large datasets
- Compare results across different environments
- Document performance regressions
- Set appropriate thresholds for CI/CD
- Test both simple and complex scenarios
- Include real-world component patterns

## Troubleshooting

### Common Issues

- **Import errors**: Ensure all libraries are installed
- **Memory issues**: Use `--expose-gc` for memory analysis
- **Performance variance**: Run multiple times for consistency

### Debug Mode

```bash
DEBUG=1 pnpm benchmark
```

## Contributing

When adding new benchmarks:

1. Follow the existing structure
2. Add proper TypeScript types
3. Include documentation
4. Test thoroughly
5. Update this README if needed
6. Focus on real-world scenarios
7. Test various complexity levels

## Performance Insights

The benchmark suite is designed to test:

- **Basic Performance**: Simple variant combinations
- **Complex Logic**: Compound variants and conditional styling
- **Slot Resolution**: Multi-slot component performance
- **Scalability**: Large dataset handling
- **Real-world Usage**: Practical component patterns
- **Memory Efficiency**: Memory usage under load
- **Edge Cases**: Extreme scenarios and stress testing

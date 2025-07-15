# @codefast-ui/progress-circle

Accessible circular progress component built with React and Radix UI, providing a robust solution for displaying progress with advanced features like threshold-based styling, indeterminate state, custom formatting, and comprehensive accessibility support.

## Features

- 🎯 **Accessible by Default** - Built with Radix UI primitives for WCAG compliance
- 🔄 **Determinate & Indeterminate** - Supports both progress tracking and loading states
- 🎨 **Threshold-Based Styling** - Dynamic color changes based on progress values
- 📏 **Customizable Size** - Configurable circle size and stroke width
- 🔢 **Flexible Value Range** - Support for custom min/max values beyond 0-100
- 📐 **Rotation Control** - Configurable start angle for progress direction
- 🎛️ **Composable Components** - Separate components for maximum customization flexibility
- 🔒 **Context-Based** - Uses Radix UI context for seamless component communication
- 📱 **Touch Friendly** - Optimized for both desktop and mobile interactions
- 🌍 **Custom Formatting** - Support for custom value formatting functions
- 📐 **TypeScript First** - Full TypeScript support with comprehensive type definitions
- 🧪 **Well Tested** - Comprehensive test coverage including accessibility tests

## Installation

```bash
# Using pnpm (recommended)
pnpm add @codefast-ui/progress-circle

# Using npm
npm install @codefast-ui/progress-circle

# Using yarn
yarn add @codefast-ui/progress-circle
```

### Peer Dependencies

This package requires React 19+ and its types:

```bash
pnpm add react@^19.0 react-dom@^19.0
pnpm add -D @types/react@^19.0 @types/react-dom@^19.0
```

## Usage

### Basic Example

```tsx
import {
  ProgressCircle,
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleTrack,
  ProgressCircleIndicator,
  ProgressCircleValue,
} from "@codefast-ui/progress-circle";

function BasicExample() {
  return (
    <ProgressCircleProvider value={75}>
      <ProgressCircle>
        <ProgressCircleSVG>
          <ProgressCircleTrack />
          <ProgressCircleIndicator />
        </ProgressCircleSVG>
        <ProgressCircleValue />
      </ProgressCircle>
    </ProgressCircleProvider>
  );
}
```

### Custom Size and Styling

```tsx
import {
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleTrack,
  ProgressCircleIndicator,
  ProgressCircleValue,
} from "@codefast-ui/progress-circle";

function CustomSizeExample() {
  return (
    <ProgressCircleProvider value={60} size={120} strokeWidth={8}>
      <div className="relative">
        <ProgressCircleSVG>
          <ProgressCircleTrack className="text-gray-200" />
          <ProgressCircleIndicator className="text-blue-600" />
        </ProgressCircleSVG>
        <ProgressCircleValue className="absolute inset-0 flex items-center justify-center text-lg font-semibold" />
      </div>
    </ProgressCircleProvider>
  );
}
```

### Threshold-Based Colors

```tsx
import {
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleTrack,
  ProgressCircleIndicator,
  ProgressCircleValue,
} from "@codefast-ui/progress-circle";

function ThresholdExample() {
  const thresholds = [
    { value: 30, color: "#ef4444", background: "#fecaca" }, // Red for low values
    { value: 70, color: "#f59e0b", background: "#fed7aa" }, // Orange for medium values
    { value: 100, color: "#10b981", background: "#bbf7d0" }, // Green for high values
  ];

  return (
    <ProgressCircleProvider value={85} thresholds={thresholds}>
      <ProgressCircleSVG>
        <ProgressCircleTrack />
        <ProgressCircleIndicator />
      </ProgressCircleSVG>
      <ProgressCircleValue />
    </ProgressCircleProvider>
  );
}
```

### Indeterminate State

```tsx
import {
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleTrack,
  ProgressCircleIndicator,
} from "@codefast-ui/progress-circle";

function IndeterminateExample() {
  return (
    <ProgressCircleProvider value={null}>
      <ProgressCircleSVG>
        <ProgressCircleTrack />
        <ProgressCircleIndicator className="animate-spin" />
      </ProgressCircleSVG>
    </ProgressCircleProvider>
  );
}
```

### Custom Value Range

```tsx
import {
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleTrack,
  ProgressCircleIndicator,
  ProgressCircleValue,
} from "@codefast-ui/progress-circle";

function CustomRangeExample() {
  return (
    <ProgressCircleProvider value={7} min={0} max={10}>
      <ProgressCircleSVG>
        <ProgressCircleTrack />
        <ProgressCircleIndicator />
      </ProgressCircleSVG>
      <ProgressCircleValue />
    </ProgressCircleProvider>
  );
}
```

### Custom Value Formatting

```tsx
import {
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleTrack,
  ProgressCircleIndicator,
  ProgressCircleValue,
} from "@codefast-ui/progress-circle";

function CustomFormattingExample() {
  const formatValue = (value: number) => `${value}/100 tasks`;

  return (
    <ProgressCircleProvider value={42} formatValue={formatValue}>
      <ProgressCircleSVG>
        <ProgressCircleTrack />
        <ProgressCircleIndicator />
      </ProgressCircleSVG>
      <ProgressCircleValue />
    </ProgressCircleProvider>
  );
}
```

### Custom Value Rendering

```tsx
import {
  ProgressCircleProvider,
  ProgressCircleSVG,
  ProgressCircleTrack,
  ProgressCircleIndicator,
  ProgressCircleValue,
} from "@codefast-ui/progress-circle";

function CustomValueRenderingExample() {
  return (
    <ProgressCircleProvider value={75}>
      <ProgressCircleSVG>
        <ProgressCircleTrack />
        <ProgressCircleIndicator />
      </ProgressCircleSVG>
      <ProgressCircleValue>
        {({ value, valueText }) => (
          <div className="text-center">
            <div className="text-2xl font-bold">{valueText}</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        )}
      </ProgressCircleValue>
    </ProgressCircleProvider>
  );
}
```

### Using Short Aliases

```tsx
import { Provider, SVG, Track, Indicator, Value } from "@codefast-ui/progress-circle";

function AliasExample() {
  return (
    <Provider value={50}>
      <SVG>
        <Track />
        <Indicator />
      </SVG>
      <Value />
    </Provider>
  );
}
```

## API Reference

### ProgressCircleProvider

The root provider component that manages the progress circle state and calculations.

#### Props

| Prop          | Type                        | Default | Description                                                  |
| ------------- | --------------------------- | ------- | ------------------------------------------------------------ |
| `children`    | `ReactNode`                 | -       | React children to be rendered inside the progress circle     |
| `value`       | `number \| null`            | -       | Current progress value (null for indeterminate state)        |
| `min`         | `number`                    | `0`     | Minimum value of the progress                                |
| `max`         | `number`                    | `100`   | Maximum value of the progress                                |
| `size`        | `number`                    | `48`    | Size of the progress circle in pixels                        |
| `strokeWidth` | `number`                    | `4`     | Width of the progress circle's stroke in pixels              |
| `startAngle`  | `number`                    | `-90`   | Starting angle of the progress circle in degrees (0 = top)   |
| `thresholds`  | `Threshold[]`               | -       | Array of threshold configurations for different value ranges |
| `formatValue` | `(value: number) => string` | -       | Custom function to format the numeric value for display      |
| `id`          | `string`                    | -       | Unique identifier for the progress circle component          |

#### Threshold Interface

```tsx
interface Threshold {
  value: number; // The value at which this threshold becomes active
  color: string; // Foreground color to be applied
  background: string; // Background color to be applied
}
```

### ProgressCircle

Root wrapper component for the progress circle.

#### Props

Extends all standard `div` element props.

### ProgressCircleSVG

SVG container component that renders the progress circle with accessibility attributes.

#### Props

Extends all standard `svg` element props.

### ProgressCircleTrack

Background circle component that renders the static track of the progress circle.

#### Props

Extends all standard `circle` element props.

### ProgressCircleIndicator

Foreground circle component that shows the actual progress with stroke dash properties.

#### Props

Extends all standard `circle` element props.

### ProgressCircleValue

Component that displays the current progress value with support for custom rendering.

#### Props

| Prop       | Type                                                                                       | Description                       |
| ---------- | ------------------------------------------------------------------------------------------ | --------------------------------- |
| `children` | `ReactNode \| ((context: { value: number \| undefined; valueText: string }) => ReactNode)` | Custom content or render function |

Extends all standard `div` element props except `children`.

## Accessibility

The progress circle component is built with accessibility in mind:

- Uses proper ARIA attributes (`role="progressbar"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`)
- Supports screen readers with descriptive labels
- Handles indeterminate state correctly for accessibility
- Provides semantic HTML structure

## Examples

### Loading Spinner

```tsx
function LoadingSpinner() {
  return (
    <ProgressCircleProvider value={null} size={32} strokeWidth={3}>
      <ProgressCircleSVG>
        <ProgressCircleTrack className="text-gray-200" />
        <ProgressCircleIndicator className="text-blue-500 animate-spin" />
      </ProgressCircleSVG>
    </ProgressCircleProvider>
  );
}
```

### File Upload Progress

```tsx
function FileUploadProgress({ uploadProgress }: { uploadProgress: number }) {
  const thresholds = [{ value: 100, color: "#10b981", background: "#dcfce7" }];

  return (
    <ProgressCircleProvider value={uploadProgress} thresholds={thresholds} size={80}>
      <div className="relative">
        <ProgressCircleSVG>
          <ProgressCircleTrack />
          <ProgressCircleIndicator />
        </ProgressCircleSVG>
        <ProgressCircleValue className="absolute inset-0 flex items-center justify-center">
          {({ valueText }) => (
            <div className="text-center">
              <div className="text-lg font-semibold">{valueText}</div>
              <div className="text-xs text-gray-500">uploaded</div>
            </div>
          )}
        </ProgressCircleValue>
      </div>
    </ProgressCircleProvider>
  );
}
```

## License

MIT © [CodeFast](https://github.com/codefastlabs/codefast)

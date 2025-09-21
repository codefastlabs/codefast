/**
 * Data Module Exports
 *
 * Explicit named exports for all test data and configurations
 * This provides better tree-shaking, IDE support, and maintainability
 */

// All variant configurations
export {
  buttonVariants,
  complexVariants,
  compoundSlotsVariants,
  extendsBaseVariants,
  extendsExtensionVariants,
  mutableComplexVariants,
  mutableCompoundSlotsVariants,
  mutableExtendsExtensionVariants,
  mutableSlotsVariants,
  slotsVariants,
} from "./variants";

// All test data sets
export {
  complexTestProps,
  compoundSlotsTestProps,
  extendsTestProps,
  fullFeaturesTestProps,
  mixedExtendsSlotsTestProps,
  mixedSlotsCompoundTestProps,
  simpleTestProps,
  slotsTestProps,
} from "./test-props";

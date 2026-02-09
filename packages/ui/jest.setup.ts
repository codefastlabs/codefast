/**
 * Jest DOM and Axe Testing Configuration
 *
 * Set up necessary extensions for testing:
 * - jest-dom: Provides custom matchers for DOM testing
 * - jest-axe: Tool for accessibility (a11y) testing
 */

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
// Learn more: https://github.com/NickColley/jest-axe
import 'jest-axe/extend-expect';

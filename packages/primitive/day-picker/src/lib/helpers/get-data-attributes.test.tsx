import { getDataAttributes } from '@/lib/helpers/get-data-attributes';

// Mocking the types that are defined elsewhere.
// TODO: does it work? Replace the types with the actual types.
type PropsBase = Record<string, unknown>;

test('return all data- attributes from the props', () => {
  const props: PropsBase = {
    'aria-label': 'test element',
    'data-role': 'button',
    'data-test-id': '123',
  };

  const result = getDataAttributes(props);

  expect(result).toEqual({
    'data-role': 'button',
    'data-test-id': '123',
  });
});

test('return an empty object if there are no data- attributes', () => {
  const props: PropsBase = {
    'aria-label': 'test element',
    class: 'example-class',
  };

  const result = getDataAttributes(props);

  expect(result).toEqual({});
});

test('handle props with undefined or null values', () => {
  const props: PropsBase = {
    'aria-hidden': 'true',
    'data-role': null,
    'data-test-id': undefined,
  };

  const result = getDataAttributes(props);

  expect(result).toEqual({
    'data-role': null,
    'data-test-id': undefined,
  });
});

export const falsyToString = (value) =>
  value === false ? "false" : value === true ? "true" : value === 0 ? "0" : value;

export const isEmptyObject = (object) => {
  if (!object || typeof object !== "object") return true;

  for (const _ in object) return false;

  return true;
};

export const isEqual = (object1, object2) => {
  if (object1 === object2) return true;

  if (!object1 || !object2) return false;

  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {

    if (!keys2.includes(key)) return false;

    if (object1[key] !== object2[key]) return false;
  }

  return true;
};

export const isBoolean = (value) => value === true || value === false;

function flat(array, target) {
  for (const element of array) {

    if (Array.isArray(element)) flat(element, target);
    else target.push(element);
  }
}

export function flatArray(array) {
  const flattened = [];

  flat(array, flattened);

  return flattened;
}

export const flatMergeArrays = (...arrays) => {
  const result = [];

  flat(arrays, result);
  const filtered = [];

  for (const element of result) {
    if (element) filtered.push(element);
  }

  return filtered;
};

export const mergeObjects = (object1, object2) => {
  const result = {};

  for (const key in object1) {
    const value1 = object1[key];

    if (key in object2) {
      const value2 = object2[key];

      if (Array.isArray(value1) || Array.isArray(value2)) {
        result[key] = flatMergeArrays(value2, value1);
      } else if (typeof value1 === "object" && typeof value2 === "object" && value1 && value2) {
        result[key] = mergeObjects(value1, value2);
      } else {
        result[key] = value2 + " " + value1;
      }
    } else {
      result[key] = value1;
    }
  }

  for (const key in object2) {
    if (!(key in object1)) {
      result[key] = object2[key];
    }
  }

  return result;
};

const SPACE_REGEX = /\s+/g;

export const removeExtraSpaces = (string_) => {
  if (!string_ || typeof string_ !== "string") return string_;

  return string_.replaceAll(SPACE_REGEX, " ").trim();
};

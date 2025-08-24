import clsx from "clsx";

/**
 * Merges two objects by combining their values using clsx for class name merging
 * 
 * @param obj1 - The target object to merge into
 * @param obj2 - The source object to merge from
 * @returns The merged object with combined values
 */
export const joinObjects = (obj1: any, obj2: any): any => {
  // Iterate through all keys in the source object
  for (const key in obj2) {
    if (key in obj1) {
      // If key exists in both objects, merge the values using clsx
      obj1[key] = clsx(obj1[key], obj2[key]) || undefined;
    } else {
      // If key only exists in source object, copy it directly
      obj1[key] = obj2[key];
    }
  }

  return obj1;
};

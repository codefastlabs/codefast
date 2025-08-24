import clsx from "clsx";

/**
 * Merges two objects by combining their values using clsx for class name merging
 *
 * @param targetObject - The target object to merge into
 * @param sourceObject - The source object to merge from
 * @returns The merged object with combined values
 */
export const joinObjects = (targetObject: any, sourceObject: any): any => {
  // Iterate through all keys in the source object
  for (const propertyKey in sourceObject) {
    if (propertyKey in targetObject) {
      // If key exists in both objects, merge the values using clsx
      targetObject[propertyKey] =
        clsx(targetObject[propertyKey], sourceObject[propertyKey]) || undefined;
    } else {
      // If key only exists in source object, copy it directly
      targetObject[propertyKey] = sourceObject[propertyKey];
    }
  }

  return targetObject;
};

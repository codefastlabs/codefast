import clsx from "clsx";

export const joinObjects = (obj1: any, obj2: any): any => {
  for (const key in obj2) {
    obj1[key] = key in obj1 ? clsx(obj1[key], obj2[key]) || undefined : obj2[key];
  }

  return obj1;
};

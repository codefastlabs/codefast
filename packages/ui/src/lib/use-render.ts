// Vendored from shadcn-ui/ui packages/react/src/use-render. A poor man's
// version of Base UI's useRender (https://base-ui.com/react/utils/use-render):
// renders a default tag, a render function, or a cloned render element, merging
// props/refs/handlers. Backs the message-scroller primitives' `render` prop.
import type {
  Attributes,
  ComponentPropsWithRef,
  CSSProperties,
  ElementType,
  ReactElement,
  Ref,
  RefCallback,
  SyntheticEvent,
} from "react";
import { cloneElement, createElement, isValidElement } from "react";

type RenderState = Record<string, unknown>;

type RenderFunction<TState extends RenderState> = (
  props: Record<string, unknown>,
  state: TState,
) => ReactElement | null;

type RenderProp<TState extends RenderState> = ReactElement | RenderFunction<TState>;

type StateAttributesMapping<TState extends RenderState> = Partial<{
  [K in keyof TState]: (value: TState[K]) => Record<string, string | undefined> | null | undefined;
}>;

type UseRenderComponentProps<
  TElement extends ElementType,
  TState extends RenderState = RenderState,
> = ComponentPropsWithRef<TElement> & {
  render?: RenderProp<TState>;
};

interface UseRenderOptions<TElement extends ElementType, TState extends RenderState> {
  defaultTagName: TElement;
  props?: ComponentPropsWithRef<TElement>;
  render?: RenderProp<TState>;
  state?: TState;
  stateAttributesMapping?: StateAttributesMapping<TState>;
}

type EventHandler = (event: SyntheticEvent) => void;

function isEventHandler(key: string): boolean {
  return /^on[A-Z]/.test(key);
}

function composeEventHandlers(theirs: EventHandler, ours: EventHandler) {
  return function handleEvent(event: SyntheticEvent) {
    theirs(event);

    if (!event.defaultPrevented) {
      ours(event);
    }
  };
}

function composeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> | undefined {
  const validRefs = refs.filter(Boolean);

  if (validRefs.length === 0) {
    return undefined;
  }

  return (value) => {
    for (const ref of validRefs) {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref) {
        ref.current = value;
      }
    }
  };
}

function mergeProps<TElement extends ElementType>(
  ...sources: Array<ComponentPropsWithRef<TElement> | Record<string, unknown> | undefined>
): ComponentPropsWithRef<TElement> {
  const result: Record<string, unknown> = {};

  for (const source of sources) {
    if (!source) {
      continue;
    }

    const sourceProps = source as Record<string, unknown>;

    for (const key of Object.keys(sourceProps)) {
      const value = sourceProps[key];

      if (value === undefined) {
        continue;
      }

      const current = result[key];

      if (key === "className") {
        result[key] = [current, value].filter(Boolean).join(" ");
      } else if (key === "style") {
        result[key] = {
          ...(current as CSSProperties | undefined),
          ...(value as CSSProperties | undefined),
        };
      } else if (key === "ref") {
        result[key] = composeRefs(current as Ref<unknown> | undefined, value as Ref<unknown> | undefined);
      } else if (isEventHandler(key) && typeof current === "function" && typeof value === "function") {
        result[key] = composeEventHandlers(value as EventHandler, current as EventHandler);
      } else {
        result[key] = value;
      }
    }
  }

  return result as ComponentPropsWithRef<TElement>;
}

function getStateAttributes<TState extends RenderState>(
  state: TState,
  mapping?: StateAttributesMapping<TState>,
): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  for (const key of Object.keys(state) as Array<keyof TState>) {
    const value = state[key];
    const attributes = mapping?.[key]?.(value);

    if (attributes) {
      Object.assign(props, attributes);
      continue;
    }

    if (key === "slot") {
      props["data-slot"] = value;
      continue;
    }

    const attribute = `data-${String(key).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;

    if (typeof value === "boolean") {
      props[attribute] = value ? "" : undefined;
    } else if (value !== null && value !== undefined) {
      props[attribute] = String(value);
    }
  }

  return props;
}

/**
 * Resolve a component's `render` prop: a default element, a render function, or
 * a cloned element, merging computed state attributes and props/refs/handlers.
 */
function useRender<TElement extends ElementType, TState extends RenderState = RenderState>({
  defaultTagName,
  props,
  render,
  state = {} as TState,
  stateAttributesMapping,
}: UseRenderOptions<TElement, TState>): ReactElement | null {
  const elementProps = mergeProps<TElement>(getStateAttributes(state, stateAttributesMapping), props);

  if (!render) {
    return createElement(defaultTagName, elementProps);
  }

  if (typeof render === "function") {
    return render(elementProps, state);
  }

  if (!isValidElement(render)) {
    return null;
  }

  const renderProps = render.props as Record<string, unknown>;
  const propsWithRenderProps = mergeProps<TElement>(elementProps, renderProps);
  const propsWithRef = {
    ...propsWithRenderProps,
    ref: composeRefs(
      (elementProps as Record<string, unknown>).ref as Ref<unknown> | undefined,
      renderProps.ref as Ref<unknown> | undefined,
    ),
  };

  return cloneElement(render, propsWithRef as Attributes & Record<string, unknown>);
}

export { composeRefs, mergeProps, useRender };
export type { UseRenderComponentProps };

import { EchoHandler } from './events';

export type EventPayload<
  E extends {
    type?: string;
    target?: unknown;
    currentTarget?: unknown;
    detail?: unknown;
  } = Record<string, any>
> = {
  type?: string;
  target?: unknown;
  currentTarget?: unknown;
  detail?: unknown;
} & E;

// type OverrideEvents<Base extends EchoEvents, E extends EventPayload> = {
//   [K in keyof Base]: Base[K] extends (event: infer EV) => void
//     ? EventHandler<Simplify<Omit<E, 'type'> & { type: K } & Omit<EV, keyof E>>>
//     : Base[K];
// };

// Cho phép tên event dạng "name" | "name:xxx"
type WithNamespace<K extends string> = K | `${K}:${string}`;

type NamespacedEvents<T> = {
  [K in keyof T & string as WithNamespace<K>]: T[K];
} & {
  [key: string]: EchoHandler<any>;
};

export type EventHandler<C = any, E extends EventPayload = EventPayload> = EchoHandler<C, [event: E]>;

export type SchemyEvents<Target = any, CurrentTarget = any> = NamespacedEvents<{
  error: EventHandler<
    CurrentTarget,
    {
      target: Target;
      currentTarget: CurrentTarget;
      detail: { error: string | Error; meta?: Record<string, any> };
    }
  >;
  errorMonitor: EventHandler<
    CurrentTarget,
    {
      target: Target;
      currentTarget: CurrentTarget;
      detail: { error: string | Error };
    }
  >;
}>;

export type ElementEvents<Target = any, CurrentTarget = any> = SchemyEvents<Target, CurrentTarget> &
  NamespacedEvents<{
    created: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
      }
    >;
    validate: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
        detail: { value: any };
      }
    >;
    validated: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
        detail: { value: any };
      }
    >;
    changed: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
      }
    >;
    updated: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
      }
    >;
    input: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
        detail: { value: any };
      }
    >;
  }>;

export type FieldEvents<Target = any, CurrentTarget = Target> = ElementEvents<Target, CurrentTarget>;

export type ContainerEventsDetail<E = any> = { element: E };

export type ContainerEvents<
  Target = any,
  CurrentTarget = any,
  Detail extends ContainerEventsDetail = ContainerEventsDetail
> = ElementEvents<Target, CurrentTarget> &
  NamespacedEvents<{
    elementValidated: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
        detail: Detail;
      }
    >;
    elementChanged: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
        detail: Detail;
      }
    >;
    elementAdded: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
        detail: Detail;
      }
    >;
    elementRemoved: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
        detail: Detail;
      }
    >;
  }>;

export type CollectionEvents<
  Target = any,
  CurrentTarget = any,
  Detail extends ContainerEventsDetail = ContainerEventsDetail
> = ContainerEvents<Target, CurrentTarget, Detail>;

export type GroupEvents<
  Target = any,
  CurrentTarget = any,
  Detail extends ContainerEventsDetail = ContainerEventsDetail
> = ContainerEvents<Target, CurrentTarget, Detail>;

export type FormEvents<
  Target = any,
  CurrentTarget = any,
  Detail extends ContainerEventsDetail = ContainerEventsDetail
> = GroupEvents<Target, CurrentTarget, Detail>;

export type ValidationEventsDetail<E = any> = { rule: E };

export type ValidationEvents<
  Target = any,
  CurrentTarget = any,
  Detail extends ValidationEventsDetail = ValidationEventsDetail
> = SchemyEvents<Target, CurrentTarget> &
  NamespacedEvents<{
    ruleAdded: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
        detail: Detail;
      }
    >;
    ruleRemoved: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
        detail: Detail;
      }
    >;
    validate: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
        detail: { value: any };
      }
    >;
    validated: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
        detail: { value: any };
      }
    >;
  }>;

export type RuleEvents<Target = any, CurrentTarget = any> = SchemyEvents<Target, CurrentTarget> &
  NamespacedEvents<{
    validate: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
        detail: { value: any };
      }
    >;
    validated: EventHandler<
      CurrentTarget,
      {
        target: Target;
        currentTarget: CurrentTarget;
        detail: { value: any };
      }
    >;
  }>;

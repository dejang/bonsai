import { useSyncExternalStore } from "react";

type Listener = () => void;
type Unsubscribe = () => void;

export class Store<T> {
  #data: T;
  #listeners = new Set<Listener>();

  constructor(initialData: T) {
    this.#data = { ...initialData };
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  getSnapshot(): T {
    return this.#data;
  }

  subscribeWithSelector(
    selector: (state: T) => unknown,
    listener: Listener,
  ): Unsubscribe {
    let previousValue = selector(this.#data);

    const checkForChange = (): void => {
      const currentValue = selector(this.#data);
      if (!Object.is(previousValue, currentValue)) {
        previousValue = currentValue;
        listener();
      }
    };

    return this.subscribe(checkForChange);
  }

  update(updates: Partial<T>): void {
    this.#data = { ...this.#data, ...updates };
    this.emitChange();
  }

  private emitChange = (): void => {
    this.#listeners.forEach((listener) => {
      listener();
    });
  };
}

export function createSelectorHook<T, S>(
  storeInstance: Store<S>,
  selector: (state: S) => T,
) {
  return (): T => {
    return useSyncExternalStore(
      (listener) => storeInstance.subscribeWithSelector(selector, listener),
      () => selector(storeInstance.getSnapshot()),
      () => selector(storeInstance.getSnapshot()),
    );
  };
}

export function createHook<T, S, U>(
  storeInstance: Store<S>,
  selector: (state: S) => T,
  setter: (value: U, currentState: S) => Partial<S>,
) {
  return (): [T, (value: U) => void] => {
    const value = useSyncExternalStore(
      (listener) => storeInstance.subscribeWithSelector(selector, listener),
      () => selector(storeInstance.getSnapshot()),
      () => selector(storeInstance.getSnapshot()),
    );

    const setValue = (newValue: U) => {
      const currentState = storeInstance.getSnapshot();
      const updates = setter(newValue, currentState);
      storeInstance.update(updates);
    };

    return [value, setValue];
  };
}

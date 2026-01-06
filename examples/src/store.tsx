import { createHook, createSelectorHook, Store } from "bonsai-react";

// Define the state interface
interface CounterState {
  count: number;
  step: number;
}

// Create the store with initial state
const counterStore = new Store<CounterState>({
  count: 0,
  step: 1,
});

// Create selector hooks
export const useCount = createHook(
  counterStore,
  (state: CounterState) => state?.count ?? 0,
  (value: number, _state: CounterState) => ({ count: value }),
);
export const useStep = createHook(
  counterStore,
  (state) => state?.step ?? 1,
  (value: number, _state: CounterState) => ({ step: value }),
);
export const useCounterState = createSelectorHook(
  counterStore,
  (state) => state,
);

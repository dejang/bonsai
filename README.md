# Bonsai

A minimal isomorphic data store for React and NextJS with TypeScript support.

## Features

- **Minimal**: Simple API with just what you need
- **Type-safe**: Full TypeScript support with strict typing
- **Selective**: Subscribe to specific parts of your state
- **Isomorphic**: Can hydrate from NextJS SSR

## Installation

```bash
npm install bonsai-react
```

```bash
yarn add bonsai-react
```

```bash
pnpm add bonsai-react
```

## Quick Start

### 1. Create a store

```typescript
import { Store } from 'bonsai-react';

interface AppState {
  count: number;
  user: { name: string; email: string } | null;
}

const store = new Store<AppState>({
  count: 0,
  user: null
});
```

### 2. Create selector hooks

```typescript
import { createSelectorHook } from 'bonsai-react';

// Subscribe to the entire state
const useAppState = createSelectorHook(store, (state) => state);

// Subscribe to just the count
const useCount = createSelectorHook(store, (state) => state?.count ?? 0);

// Subscribe to just the user
const useUser = createSelectorHook(store, (state) => state?.user);
```

### 3. Use in your React components

```tsx
import React from 'react';

function Counter() {
  const count = useCount();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => store.update({ count: count + 1 })}>
        Increment
      </button>
    </div>
  );
}

function UserProfile() {
  const user = useUser();

  if (!user) {
    return <div>No user logged in</div>;
  }

  return (
    <div>
      <h2>Welcome, {user.name}!</h2>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

## API Reference

### `Store<T>`

Creates a new store instance.

#### Constructor

```typescript
new Store<T>(initialData: T | null)
```

Or extend the Store if you need to handle bootstrap the store using async calls.
```typescript
class MyStore extends Store<StoreShape> {
  constructor(...args) {
    super(...args);
    myAsyncFn().then((newState) => {
      this.update(newState);
    });
  }
}
```

#### Methods

- **`update(updates: Partial<T>): void`** - Updates the store with partial data
- **`getSnapshot(): T | null`** - Gets the current state snapshot
- **`subscribe(listener: () => void): () => void`** - Subscribes to all state changes
- **`subscribeWithSelector(selector, listener): () => void`** - Subscribes to specific state changes

### `createSelectorHook<T, S>(store, selector)`

Creates a React hook that subscribes to a specific part of the store. This is a read only hook.

### `createHook<T, S, U>(store, selector, setter)`

Create a React hook that subscribes to changes and also provides a setter. Similar to React's useState.

## See examples folder.

## Advanced Usage

You can create multiple stores, combine them, extend the original store and add any kind of functionality you desire. The initial store is designed to be minimal but extensible.


### Multiple Stores

You can create multiple stores for different domains:

```typescript
const userStore = new Store({ user: null, preferences: {} });
const cartStore = new Store({ items: [], total: 0 });

const useUser = createSelectorHook(userStore, (state) => state?.user);
const useCart = createSelectorHook(cartStore, (state) => state?.items ?? []);
```

### Complex Selectors

Selectors can compute derived state:

```typescript
const useCartTotal = createSelectorHook(cartStore, (state) => {
  return state?.items.reduce((sum, item) => sum + item.price, 0) ?? 0;
});

const useIsLoggedIn = createSelectorHook(userStore, (state) => {
  return state?.user !== null;
});
```

### Combining Multiple Stores

You can combine multiple stores into one larger store for centralized state management:

```typescript
// Individual stores
const userStore = new Store({ user: null, preferences: {} });
const cartStore = new Store({ items: [], total: 0 });
const uiStore = new Store({ theme: 'light', sidebarOpen: false });

// Combined store interface
interface CombinedState {
  user: typeof userStore extends Store<infer U> ? U : never;
  cart: typeof cartStore extends Store<infer C> ? C : never;
  ui: typeof uiStore extends Store<infer I> ? I : never;
}

// Create a master store that syncs with individual stores
class CombinedStore extends Store<CombinedState> {
  constructor() {
    super({
      user: userStore.getSnapshot(),
      cart: cartStore.getSnapshot(),
      ui: uiStore.getSnapshot()
    });

    // Subscribe to individual store changes
    userStore.subscribe(() => {
      this.update({ user: userStore.getSnapshot() });
    });

    cartStore.subscribe(() => {
      this.update({ cart: cartStore.getSnapshot() });
    });

    uiStore.subscribe(() => {
      this.update({ ui: uiStore.getSnapshot() });
    });
  }

  // Proxy methods to individual stores
  updateUser(updates: Parameters<typeof userStore.update>[0]) {
    userStore.update(updates);
  }

  updateCart(updates: Parameters<typeof cartStore.update>[0]) {
    cartStore.update(updates);
  }

  updateUI(updates: Parameters<typeof uiStore.update>[0]) {
    uiStore.update(updates);
  }
}

const combinedStore = new CombinedStore();

// Use the combined store
const useAppState = createSelectorHook(combinedStore, (state) => state);
const useCombinedUser = createSelectorHook(combinedStore, (state) => state?.user);
```

### Server-Side Rendering

Bonsai works great with SSR frameworks like Next.js. Use a provider pattern to pass server-side data and instantiate stores:

```tsx
import React, { createContext, useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import { Store } from 'bonsai-react';

interface AppState {
  user: { name: string; email: string } | null;
  posts: Array<{ id: string; title: string }>;
}

// Create a context for the store
const StoreContext = createContext<Store<AppState> | null>(null);

// Provider component that instantiates the store with SSR data
export function StoreProvider({ 
  children, 
  initialData 
}: { 
  children: React.ReactNode;
  initialData: AppState | null;
}) {
  // Memoize store creation to prevent recreation on re-renders
  const store = useMemo(() => new Store<AppState>(initialData), [initialData]);
  
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
}

// Hook to get the store instance
function useStore() {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return store;
}

// Create hooks that work with the context
export function useUser() {
  const store = useStore();
  return useSyncExternalStore(
    (listener) => store.subscribeWithSelector((state) => state?.user, listener),
    () => store.getSnapshot()?.user ?? null,
    () => store.getSnapshot()?.user ?? null
  );
}

export function usePosts() {
  const store = useStore();
  return useSyncExternalStore(
    (listener) => store.subscribeWithSelector((state) => state?.posts, listener),
    () => store.getSnapshot()?.posts ?? [],
    () => store.getSnapshot()?.posts ?? []
  );
}

// Next.js usage example
export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <StoreProvider initialData={pageProps.storeData}>
      <Component {...pageProps} />
    </StoreProvider>
  );
}

// In your page/API route
export async function getServerSideProps() {
  const storeData = {
    user: await fetchUser(),
    posts: await fetchPosts(),
  };

  return {
    props: {
      storeData,
    },
  };
}
```

## TypeScript Support

Bonsai is built with TypeScript and provides full type safety:

```typescript
interface MyState {
  count: number;
  items: string[];
}

const store = new Store<MyState>({ count: 0, items: [] });

// TypeScript will enforce the correct shape
store.update({ count: 5 }); // ✅ OK
store.update({ invalid: true }); // ❌ TypeScript error

// Selectors are also type-safe
const useCount = createSelectorHook(store, (state) => {
  return state?.count ?? 0; // TypeScript knows this returns number
});
```

## Requirements

- React 18.0.0 or higher
- TypeScript 4.5.0 or higher (optional, but recommended)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

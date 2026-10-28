# Kanban Board — Learning Roadmap

This document is your guide to keep building and improving the Kanban board. It's structured as questions for you to attempt, with answers hidden below each one. Try before you look.

---

## Part 1: Improving the Current Project

---

### Chapter 1: Complete Drag and Drop

**Concept**

You've implemented same-column and cross-column card dragging. The next step is making columns themselves draggable so the user can reorder them. The pattern is identical — the difference is that columns are the draggable items this time, not cards.

---

**Q1.1 — Column reordering**

Columns are currently rendered inside a `Droppable` in `Board.tsx` but the `<li>` elements are not wrapped in `Draggable`. Enable column reordering so the user can drag entire columns left and right.

<details>
<summary>Answer</summary>

In `Board.tsx`, wrap each `<li>` in `Draggable` with `draggableId={column.id.toString()}` and `index={index}`. Apply `provided.draggableProps`, `provided.dragHandleProps`, and `ref={provided.innerRef}` to the `<li>`.

In `handleDragEnd` in `App.tsx`, check whether the drag happened in the `"droppableColumn"` zone (column reorder) vs a column id zone (card move). Handle each case separately:

```ts
if (result.source.droppableId === 'droppableColumn') {
  const newColumns = [...columns];
  const [removed] = newColumns.splice(result.source.index, 1);
  newColumns.splice(result.destination.index, 0, removed);
  setColumns(newColumns);
}
```

</details>

---

**Q1.2 — Visual feedback during drag**

When a card is being dragged, there's no visual feedback. Add an opacity change to the card being dragged so the user knows which card is moving.

<details>
<summary>Answer</summary>

`Draggable`'s render prop gives you a `snapshot` object as the second argument:

```tsx
<Draggable ...>
  {(provided, snapshot) => (
    <li
      style={{ opacity: snapshot.isDragging ? 0.5 : 1 }}
      ...
    >
```

`snapshot.isDragging` is `true` while the card is being dragged.

</details>

---

**Q1.3 — Highlight the drop zone**

When a card is dragged over a column, highlight the column background so the user knows where they're about to drop.

<details>
<summary>Answer</summary>

`Droppable`'s render prop also gives you a `snapshot` object:

```tsx
<Droppable ...>
  {(provided, snapshot) => (
    <ul
      className={`... ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
      ...
    >
```

`snapshot.isDraggingOver` is `true` when a draggable is hovering over this droppable.

</details>

---

### Chapter 2: Custom Hooks

**Concept**

A custom hook is a function that starts with `use` and calls other React hooks. It lets you extract stateful logic out of a component so it can be reused elsewhere. It's not a new feature — it's just a pattern for organizing code.

```ts
// Instead of this in every component:
const [value, setValue] = useState(...)
useEffect(() => { localStorage.setItem(key, ...) }, [value])

// You write this once:
function useLocalStorage(key, initialValue) { ... }

// And use it anywhere:
const [columns, setColumns] = useLocalStorage('columns', [])
```

---

**Q2.1 — Extract `useLocalStorage`**

Create a custom hook `useLocalStorage(key, initialValue)` that:
- Reads from localStorage on mount (with a fallback to `initialValue`)
- Syncs to localStorage whenever the value changes
- Returns `[value, setValue]` just like `useState`

Replace the `useState` + `useEffect` combo in `App.tsx` with this hook.

<details>
<summary>Answer</summary>

Create `src/hooks/useLocalStorage.ts`:

```ts
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}
```

In `App.tsx`:

```ts
const [columns, setColumns] = useLocalStorage<ColumnType[]>('columns', [...])
```

The `useEffect` in `App.tsx` can then be deleted.

**Why `as const`?** Without it, TypeScript infers the return type as `(T | Dispatch<SetStateAction<T>>)[]` — a union array. `as const` makes it a proper tuple `[T, Dispatch<SetStateAction<T>>]` so TypeScript knows the exact type at each position.

</details>

---

**Q2.2 — Extract `useColumns`**

Create a custom hook `useColumns` that encapsulates all column and card operations: `handleAddCard`, `handleDeleteCard`, `handleEditCard`, `handleAddColumn`, `handleDeleteColumn`, `handleDragEnd`. The hook returns `{ columns, ...handlers }`.

<details>
<summary>Answer</summary>

Create `src/hooks/useColumns.ts`:

```ts
import { useLocalStorage } from './useLocalStorage'
import type { Column, Card, ColorOption } from '../types'
import type { DropResult } from '@hello-pangea/dnd'

export function useColumns(initialColumns: Column[]) {
  const [columns, setColumns] = useLocalStorage<Column[]>('columns', initialColumns)

  function handleAddCard(columnId: number, newCard: Card) { ... }
  function handleDeleteCard(columnId: number, cardId: number) { ... }
  // ... etc

  return { columns, handleAddCard, handleDeleteCard, ... }
}
```

In `App.tsx`:
```ts
const { columns, handleAddCard, ... } = useColumns(defaultColumns)
```

`App.tsx` becomes almost entirely JSX — all logic lives in the hook. This is the separation of concerns principle.

</details>

---

### Chapter 3: Performance

**Concept**

React re-renders a component every time its state or props change. For most apps this is fast enough, but as your app grows, unnecessary re-renders can cause slowdowns. Three tools help:

- **`useCallback`** — memoizes a function so it's not recreated on every render
- **`useMemo`** — memoizes a computed value
- **`React.memo`** — prevents a component from re-rendering if its props haven't changed

**When to use them:** Only when you have a measured performance problem. Adding them everywhere adds complexity without benefit.

---

**Q3.1 — Memoize handlers with `useCallback`**

In `App.tsx`, every handler function (`handleAddCard`, `handleDeleteCard`, etc.) is recreated on every render. Wrap them in `useCallback` so they're only recreated when their dependencies change.

<details>
<summary>Answer</summary>

```ts
const handleAddCard = useCallback((columnId: number, newCard: Card) => {
  setColumns(prev => prev.map(col =>
    col.id === columnId
      ? { ...col, cards: [...col.cards, newCard] }
      : col
  ))
}, []) // no dependencies — uses setColumns functional update form
```

**Important:** When using `useCallback`, use the functional update form of `setColumns` (`prev => ...`) instead of referencing `columns` directly. This avoids adding `columns` as a dependency, which would defeat the purpose.

</details>

---

**Q3.2 — Prevent `Column` from re-rendering unnecessarily**

Every time any column changes, all `Column` components re-render — even the ones that didn't change. Wrap `Column` in `React.memo` to prevent this.

<details>
<summary>Answer</summary>

```ts
import { memo } from 'react'

export default memo(function Column({ ... }) {
  ...
})
```

`React.memo` does a shallow comparison of props. If the props are the same reference, the component skips re-rendering. This works best when the parent uses `useCallback` for handlers — otherwise new function references are created every render, causing memo to always re-render anyway.

</details>

---

### Chapter 4: TypeScript Improvements

**Concept**

You've typed all your props and state. The next level is making your types stricter so TypeScript catches more mistakes at compile time.

---

**Q4.1 — Make `colorOptions` type-safe with `as const`**

`colorOptions` is currently typed as a plain object array. Use `as const` to make it a readonly tuple so TypeScript knows the exact string values.

<details>
<summary>Answer</summary>

```ts
const colorOptions = [
  { name: 'blue', bgColor: 'bg-blue-100', fontColor: 'text-blue-950', swatchColor: 'bg-blue-200' },
  ...
] as const
```

With `as const`, TypeScript knows `colorOptions[0].name` is the literal type `'blue'`, not just `string`. This lets you derive types from the array:

```ts
type ColorName = typeof colorOptions[number]['name'] // 'blue' | 'purple' | 'green' | 'red'
```

</details>

---

**Q4.2 — Add a `CardStatus` type for the editing state**

Currently `cardId` state in `Column.tsx` is `number | null`. Create a more descriptive type that makes the intent clearer.

<details>
<summary>Answer</summary>

**Option 1 — Type alias (simpler):**
```ts
type EditingCardId = number | null
const [editingCardId, setEditingCardId] = useState<EditingCardId>(null)
```

**Option 2 — Discriminated union (more expressive):**
```ts
type EditState =
  | { type: 'idle' }
  | { type: 'editing'; cardId: number }

const [editState, setEditState] = useState<EditState>({ type: 'idle' })
```

Option 2 is better when you need to store more state alongside the editing flag (e.g. a loading state). Option 1 is fine for simple cases. The discriminated union pattern scales better and makes impossible states unrepresentable.

</details>

---

**Q4.3 — Validate localStorage data at runtime**

`JSON.parse` returns `any` — if the shape of stored data ever changes (e.g. you add a new field), the app could silently break. Add runtime validation using `zod`.

<details>
<summary>Answer</summary>

Install: `npm install zod`

```ts
import { z } from 'zod'

const CardSchema = z.object({
  id: z.number(),
  title: z.string(),
  tag: z.string(),
  bgcolor: z.string(),
  fontcolor: z.string(),
})

const ColumnSchema = z.object({
  id: z.number(),
  title: z.string(),
  cards: z.array(CardSchema),
})

const ColumnsSchema = z.array(ColumnSchema)
```

In `useLocalStorage`:
```ts
const saved = localStorage.getItem(key)
if (saved) {
  const parsed = ColumnsSchema.safeParse(JSON.parse(saved))
  if (parsed.success) return parsed.data
}
return initialValue
```

`safeParse` returns `{ success: true, data }` or `{ success: false, error }` — it never throws.

</details>

---

### Chapter 5: Context API

**Concept**

Right now `handleAddCard`, `handleDeleteCard`, etc. are passed from `App` → `Board` → `Column`. `Board` doesn't use them — it just passes them through. This is called **prop drilling**.

Context solves this: you put data in a context at the top, and any component deep in the tree can read it directly without passing props through every level in between.

```
Without context:          With context:
App                       App (provides context)
└── Board (passes props)    └── Board (no handlers needed)
    └── Column (uses)           └── Column (reads from context)
```

---

**Q5.1 — Create a `BoardContext`**

Create a `BoardContext` that provides `columns` and all handlers to any component that needs them. Replace prop drilling in `Board.tsx` and `Column.tsx`.

<details>
<summary>Answer</summary>

Create `src/context/BoardContext.tsx`:

```ts
import { createContext, useContext } from 'react'
import type { Card, Column, ColorOption } from '../types'

type BoardContextType = {
  columns: Column[]
  handleAddCard: (columnId: number, newCard: Card) => void
  handleDeleteCard: (columnId: number, cardId: number) => void
  handleEditCard: (columnId: number, cardId: number, title: string, tag: string, bgcolor: string, colorOptions: ColorOption[]) => void
  handleAddColumn: (title: string) => void
  handleDeleteColumn: (columnId: number) => void
}

export const BoardContext = createContext<BoardContextType | null>(null)

// Custom hook to safely consume the context
export function useBoardContext() {
  const ctx = useContext(BoardContext)
  if (!ctx) throw new Error('useBoardContext must be used inside BoardContext.Provider')
  return ctx
}
```

In `App.tsx`, wrap everything:
```tsx
<BoardContext.Provider value={{ columns, handleAddCard, ... }}>
  <DragDropContext onDragEnd={handleDragEnd}>
    <Board />
  </DragDropContext>
</BoardContext.Provider>
```

In `Column.tsx`:
```ts
const { handleAddCard, handleDeleteCard, handleEditCard } = useBoardContext()
```

</details>

---

**Q5.2 — Replace `useState` + handlers with `useReducer`**

`useReducer` is an alternative to `useState` for complex state. Instead of many setter functions, you dispatch actions and a single reducer function handles all state changes.

Refactor `App.tsx` to use `useReducer` for the columns state.

<details>
<summary>Answer</summary>

```ts
type Action =
  | { type: 'ADD_CARD'; columnId: number; card: Card }
  | { type: 'DELETE_CARD'; columnId: number; cardId: number }
  | { type: 'EDIT_CARD'; columnId: number; cardId: number; updatedCard: Partial<Card> }
  | { type: 'ADD_COLUMN'; title: string }
  | { type: 'DELETE_COLUMN'; columnId: number }
  | { type: 'REORDER_CARDS'; result: DropResult }

function boardReducer(state: Column[], action: Action): Column[] {
  switch (action.type) {
    case 'ADD_CARD':
      return state.map(col =>
        col.id === action.columnId
          ? { ...col, cards: [...col.cards, action.card] }
          : col
      )
    // ... other cases
    default:
      return state
  }
}

// In App.tsx:
const [columns, dispatch] = useReducer(boardReducer, initialColumns)
```

**Why `useReducer` over `useState`?** When state transitions are complex and related, a reducer makes all possible state changes explicit and testable. It's also easier to persist (you just serialize the state) and debug (you can log every action). This pattern is essentially what Redux does — Redux just adds a global store and dev tools on top.

</details>

---

### Chapter 6: Testing

**Concept**

Tests give you confidence that your app works correctly and that future changes don't break existing behaviour. There are two main types:

- **Unit tests** — test a single function in isolation
- **Integration tests** — test how components work together

For React, the standard tools are **Vitest** (test runner) and **React Testing Library** (component testing).

---

**Q6.1 — Unit test the reducer**

If you've completed Q5.2, write unit tests for `boardReducer`. Test that `ADD_CARD` correctly adds a card to the right column, and `DELETE_CARD` correctly removes one.

<details>
<summary>Answer</summary>

```ts
import { describe, it, expect } from 'vitest'
import { boardReducer } from '../reducers/boardReducer'

const initialState = [
  { id: 1, title: 'To Do', cards: [{ id: 1, title: 'Task A', tag: '', bgcolor: '', fontcolor: '' }] }
]

describe('boardReducer', () => {
  it('adds a card to the correct column', () => {
    const newCard = { id: 2, title: 'Task B', tag: '', bgcolor: '', fontcolor: '' }
    const result = boardReducer(initialState, { type: 'ADD_CARD', columnId: 1, card: newCard })
    expect(result[0].cards).toHaveLength(2)
    expect(result[0].cards[1].title).toBe('Task B')
  })

  it('does not mutate the original state', () => {
    const newCard = { id: 2, title: 'Task B', tag: '', bgcolor: '', fontcolor: '' }
    boardReducer(initialState, { type: 'ADD_CARD', columnId: 1, card: newCard })
    expect(initialState[0].cards).toHaveLength(1) // unchanged
  })
})
```

</details>

---

### Chapter 7: UI/UX Improvements

**Q7.1 — Card count badge on each column header**

Show how many cards are in each column next to the column title.

<details>
<summary>Answer</summary>

In `Board.tsx`, inside the column header:
```tsx
<span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
  {column.cards.length}
</span>
```

</details>

---

**Q7.2 — Empty state for columns**

When a column has no cards, show a subtle placeholder message instead of blank space.

<details>
<summary>Answer</summary>

In `Column.tsx`, replace the `cards.length === 0 ? null :` check:

```tsx
{cards.length === 0
  ? <p className="text-xs text-gray-300 text-center py-4">No cards yet</p>
  : cards.map(...)}
```

</details>

---

**Q7.3 — Confirmation before deleting a column**

Deleting a column with cards in it is destructive. Add a confirmation step before the delete goes through.

<details>
<summary>Answer</summary>

**Option 1 — Browser confirm (simplest):**
```ts
function handleDeleteColumn(columnId: number) {
  if (!window.confirm('Delete this column and all its cards?')) return
  setColumns(columns.filter(col => col.id !== columnId))
}
```

**Option 2 — Inline confirmation UI (better UX):**
Track a `pendingDeleteId` state. When the trash icon is clicked, set `pendingDeleteId`. Render "Are you sure?" buttons on that column. Only delete on confirmation.

Option 2 is better for production — `window.confirm` blocks the UI thread and can't be styled.

</details>

---

**Q7.4 — Keyboard shortcut to add a card**

Allow the user to press `N` when hovering over a column to open the add-card form.

<details>
<summary>Answer</summary>

In `Column.tsx`, add a `useEffect` with a `keydown` listener, scoped to when the column is focused/hovered:

```ts
useEffect(() => {
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'n' && !isAdding) setIsAdding(true)
  }
  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}, [isAdding])
```

The cleanup function (`return () => ...`) is essential — it removes the listener when the component unmounts or re-runs, preventing memory leaks.

</details>

---

## Part 2: Redux

---

### What is Redux and why use it?

Redux is a **global state manager**. Instead of state living inside components and being passed as props, all state lives in a single **store** outside React. Any component can read from it or dispatch actions to update it.

**Context vs Redux — when to use which:**

| | Context | Redux |
|---|---|---|
| Best for | Relatively static data (theme, auth, locale) | Frequently changing complex state |
| Dev tools | None built-in | Excellent time-travel debugger |
| Boilerplate | Low | Moderate (lower with Redux Toolkit) |
| Performance | Can cause unnecessary re-renders | Optimized with selectors |
| Middleware | Not built-in | Built-in (thunks, saga, etc.) |

For a Kanban board with frequent updates (drag, edit, delete), Redux is a reasonable choice over Context.

**Redux Toolkit (RTK)** is the official, modern way to write Redux. It eliminates most boilerplate. Always use RTK — never write plain Redux from scratch.

---

### Core Concepts

**Store** — the single source of truth. One object that holds all your state.

**Slice** — a piece of the store with its own state, actions, and reducer. You'll create one slice: `columnsSlice`.

**Action** — a plain object describing what happened: `{ type: 'columns/addCard', payload: { columnId: 1, card: {...} } }`

**Reducer** — a pure function that takes the current state and an action and returns the new state. RTK uses Immer under the hood, so you can write "mutating" code that's actually immutable.

**Dispatch** — how you trigger a state change: `dispatch(addCard({ columnId: 1, card: newCard }))`

**Selector** — a function that reads from the store: `useSelector(state => state.columns)`

---

### Chapter 8: Setting Up Redux Toolkit

**Q8.1 — Install and configure**

Install Redux Toolkit and React-Redux. Create a store and wrap your app with a `Provider`.

<details>
<summary>Answer</summary>

```bash
npm install @reduxjs/toolkit react-redux
```

Create `src/store/store.ts`:
```ts
import { configureStore } from '@reduxjs/toolkit'
import columnsReducer from './columnsSlice'

export const store = configureStore({
  reducer: {
    columns: columnsReducer,
  },
})

// Infer types from the store itself — always do this
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

In `main.tsx`:
```tsx
import { Provider } from 'react-redux'
import { store } from './store/store'

ReactDOM.createRoot(...).render(
  <Provider store={store}>
    <App />
  </Provider>
)
```

</details>

---

### Chapter 9: Creating the Columns Slice

**Q9.1 — Create `columnsSlice`**

Create a slice that holds the columns array and defines reducers for all operations: `addCard`, `deleteCard`, `editCard`, `addColumn`, `deleteColumn`, `reorderCards`.

<details>
<summary>Answer</summary>

Create `src/store/columnsSlice.ts`:

```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Column, Card, ColorOption } from '../types'
import type { DropResult } from '@hello-pangea/dnd'

const initialState: Column[] = JSON.parse(localStorage.getItem('columns') ?? 'null') ?? []

const columnsSlice = createSlice({
  name: 'columns',
  initialState,
  reducers: {
    addCard(state, action: PayloadAction<{ columnId: number; card: Card }>) {
      const column = state.find(col => col.id === action.payload.columnId)
      column?.cards.push(action.payload.card)
      // RTK uses Immer — you CAN mutate state directly here
    },
    deleteCard(state, action: PayloadAction<{ columnId: number; cardId: number }>) {
      const column = state.find(col => col.id === action.payload.columnId)
      if (column) {
        column.cards = column.cards.filter(card => card.id !== action.payload.cardId)
      }
    },
    editCard(state, action: PayloadAction<{ columnId: number; cardId: number; updates: Partial<Card> }>) {
      const column = state.find(col => col.id === action.payload.columnId)
      const card = column?.cards.find(c => c.id === action.payload.cardId)
      if (card) Object.assign(card, action.payload.updates)
    },
    addColumn(state, action: PayloadAction<{ title: string }>) {
      state.push({ id: Date.now(), title: action.payload.title, cards: [] })
    },
    deleteColumn(state, action: PayloadAction<{ columnId: number }>) {
      return state.filter(col => col.id !== action.payload.columnId)
    },
    reorderCards(state, action: PayloadAction<DropResult>) {
      const result = action.payload
      if (!result.destination) return
      const sourceCol = state.find(col => col.id.toString() === result.source.droppableId)
      const destCol = state.find(col => col.id.toString() === result.destination!.droppableId)
      if (!sourceCol || !destCol) return
      const [removed] = sourceCol.cards.splice(result.source.index, 1)
      destCol.cards.splice(result.destination.index, 0, removed)
    },
  },
})

export const { addCard, deleteCard, editCard, addColumn, deleteColumn, reorderCards } = columnsSlice.actions
export default columnsSlice.reducer
```

**Why can you mutate state in RTK?** RTK wraps your reducers with **Immer**, a library that detects your mutations and produces a new immutable state behind the scenes. You write simpler code; Immer handles immutability.

</details>

---

### Chapter 10: Typed Hooks

**Q10.1 — Create typed `useAppSelector` and `useAppDispatch` hooks**

`useSelector` and `useDispatch` from `react-redux` are untyped by default. Create typed versions so TypeScript knows the shape of your store.

<details>
<summary>Answer</summary>

Create `src/store/hooks.ts`:

```ts
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

// Use these throughout the app instead of plain useDispatch/useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T) =>
  useSelector(selector)
```

Usage:
```ts
const columns = useAppSelector(state => state.columns)
const dispatch = useAppDispatch()
```

</details>

---

### Chapter 11: Connecting Components to Redux

**Q11.1 — Migrate `App.tsx`**

Remove all `useState`, `useEffect`, and handler functions from `App.tsx`. The component should only render the `DragDropContext` and `Board`, dispatching `reorderCards` on drag end.

<details>
<summary>Answer</summary>

```tsx
import { DragDropContext } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import { useAppDispatch } from './store/hooks'
import { reorderCards } from './store/columnsSlice'
import Board from './components/Board'

export default function App() {
  const dispatch = useAppDispatch()

  function handleDragEnd(result: DropResult) {
    dispatch(reorderCards(result))
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Board />
      </DragDropContext>
    </main>
  )
}
```

`Board`, `Column`, and other components now read from the store directly instead of receiving props.

</details>

---

**Q11.2 — Migrate `Column.tsx`**

Remove `onAddCard`, `onDeleteCard`, `onEditCard` props from `Column`. Instead, read `cards` from the store with `useAppSelector` and dispatch actions directly.

<details>
<summary>Answer</summary>

```ts
const dispatch = useAppDispatch()
const cards = useAppSelector(state =>
  state.columns.find(col => col.id === columnId)?.cards ?? []
)

function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  dispatch(addCard({ columnId, card: { id: Date.now(), title, tag, bgcolor: selectedColorValue, fontcolor: selectedFontValue } }))
  handleCancelCard()
}
```

</details>

---

### Chapter 12: Persisting Redux State

**Q12.1 — Sync Redux store to localStorage**

With Redux, the `useEffect` that saved to localStorage is gone. Add a store subscriber that persists state on every change.

<details>
<summary>Answer</summary>

In `store.ts`, after creating the store:

```ts
store.subscribe(() => {
  localStorage.setItem('columns', JSON.stringify(store.getState().columns))
})
```

`store.subscribe` runs a callback every time the store updates. This replaces the `useEffect` approach.

**Alternative — `redux-persist`:** For production apps, use the `redux-persist` library which handles persistence, rehydration, and migration automatically.

```bash
npm install redux-persist
```

It handles edge cases like partial state rehydration, versioning, and async storage (for React Native).

</details>

---

### Chapter 13: Selectors

**Concept**

A **selector** is a function that derives data from the store. Instead of scattering `state.columns.find(...)` throughout your components, you define named selectors once and reuse them.

RTK's `createSelector` creates **memoized selectors** — the derived value is only recalculated when its inputs change.

---

**Q13.1 — Create selectors for common data access**

Create a `selectColumns` selector and a `selectColumnById` selector factory.

<details>
<summary>Answer</summary>

In `src/store/selectors.ts`:

```ts
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from './store'

export const selectColumns = (state: RootState) => state.columns

export const selectColumnById = (columnId: number) =>
  createSelector(
    selectColumns,
    columns => columns.find(col => col.id === columnId)
  )

export const selectCardCount = createSelector(
  selectColumns,
  columns => columns.reduce((total, col) => total + col.cards.length, 0)
)
```

Usage in a component:
```ts
const column = useAppSelector(selectColumnById(columnId))
```

**Why memoized selectors?** Without `createSelector`, the selector runs on every render even if the relevant state hasn't changed. `createSelector` caches the result and only recomputes when the input selectors return different values.

</details>

---

### Chapter 14: Async Operations with Thunks

**Concept**

Right now your data lives only in the browser. A real app would fetch cards from an API. Redux Toolkit includes `createAsyncThunk` for handling async operations with loading/error states.

---

**Q14.1 — Simulate fetching initial columns from an API**

Create an async thunk `fetchColumns` that simulates a network request (use `setTimeout` to fake a delay). Add `loading` and `error` state to your slice and handle the three states: `pending`, `fulfilled`, `rejected`.

<details>
<summary>Answer</summary>

```ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchColumns = createAsyncThunk('columns/fetch', async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500))
  return JSON.parse(localStorage.getItem('columns') ?? '[]')
})

const columnsSlice = createSlice({
  name: 'columns',
  initialState: {
    data: [] as Column[],
    loading: false,
    error: null as string | null,
  },
  reducers: { /* ... */ },
  extraReducers: (builder) => {
    builder
      .addCase(fetchColumns.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchColumns.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchColumns.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to load'
      })
  }
})
```

In `App.tsx`:
```ts
useEffect(() => {
  dispatch(fetchColumns())
}, [])
```

</details>

---

*End of roadmap. Work through each question in order — each builds on the previous one. Check answers only after attempting the implementation yourself.*

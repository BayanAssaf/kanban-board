# Hooks, Context & Modern Patterns — Project Roadmap

**How this works:** Every chapter adds a real feature to your Kanban board. Each step is a question — attempt it yourself first, then open the answer to check your work. By the end, your app is significantly more capable.

**Prerequisites:** Your Kanban board is working with CRUD, drag and drop, localStorage persistence, and undo toast.

---

## Chapter 1: Card Priority System

**What you're building:** Priority levels (None / Low / Medium / High) on cards, with color-coded badges and the ability to sort cards by priority within a column.

**Concept — Union types & derived state**

A union type restricts a value to a fixed set of options:
```ts
type Direction = 'north' | 'south' | 'east' | 'west'
```
TypeScript will catch typos at compile time and autocomplete valid values. Use this instead of `string` whenever you have a known set of options.

**Derived state** is a value computed from state, not stored in state:
```ts
// ❌ Don't store it — it duplicates state and can go out of sync
const [sortedTodos, setSortedTodos] = useState([...todos].sort(...))

// ✅ Derive it — recomputed on every render, always in sync
const sortedTodos = [...todos].sort(...)
```

---

**Q1.1 — Add a `priority` field to the Card type**

Open `types.ts`. Add a `priority` field to the `Card` interface. It should only accept four values. Think about the most specific TypeScript type for this rather than using `string`.

Then update your hardcoded initial cards in `App.tsx` to include `priority: 'none'` on each one.

<details>
<summary>Answer</summary>

```ts
// types.ts
export type Priority = 'none' | 'low' | 'medium' | 'high'

export interface Card {
  id: number
  title: string
  tag: string
  bgcolor: string
  fontcolor: string
  priority: Priority  // ← add this
}
```

In `App.tsx`, add `priority: 'none'` to each hardcoded card:
```ts
{ id: 4, title: 'Set up Vite project', tag: 'Setup', bgcolor: 'bg-blue-100', fontcolor: 'text-blue-950', priority: 'none' },
```

**Why not `string`?** With `type Priority = 'none' | 'low' | 'medium' | 'high'`, TypeScript will error if you write `priority: 'hight'` — catching the typo at compile time. With `string`, it silently accepts any value.

</details>

---

**Q1.2 — Add a priority selector to the add-card form**

In `Column.tsx`, add a priority selector to the add-card form. It should render four buttons (None / Low / Medium / High). Clicking one highlights it as selected and stores the choice in state. Include the priority when calling `onAddCard`.

Don't forget to reset the priority when the form is cancelled.

<details>
<summary>Answer</summary>

Add state in `Column.tsx`:
```ts
const [selectedPriority, setSelectedPriority] = useState<Priority>('none')
```

Include it in `handleSubmit`:
```ts
onAddCard(columnId, {
  id: Date.now(), title, tag,
  bgcolor: selectedColorValue,
  fontcolor: selectedFontValue,
  priority: selectedPriority
})
```

Reset it in `handleCancelCard`:
```ts
setSelectedPriority('none')
```

Priority buttons in the form JSX:
```tsx
<div className="flex gap-2 mt-2">
  {(['none', 'low', 'medium', 'high'] as Priority[]).map(p => (
    <button
      key={p}
      type="button"
      onClick={() => setSelectedPriority(p)}
      className={`text-xs px-2 py-1 rounded-lg border capitalize
        ${selectedPriority === p
          ? 'bg-gray-800 text-white border-gray-800'
          : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
    >
      {p}
    </button>
  ))}
</div>
```

</details>

---

**Q1.3 — Display a priority badge on each card**

In `Column.tsx`, show a small colored badge on each card reflecting its priority. If priority is `'none'`, show nothing. Use these colors: low → blue, medium → yellow, high → red.

<details>
<summary>Answer</summary>

Define a style map outside the component (it never changes, no need to recreate it):

```ts
const priorityStyles: Record<Priority, string> = {
  none: '',
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}
```

Inside the card JSX, below the tag:
```tsx
{card.priority !== 'none' && (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block ${priorityStyles[card.priority]}`}>
    {card.priority}
  </span>
)}
```

</details>

---

**Q1.4 — Add a "sort by priority" toggle to each column**

Add a button to each column header. When active, cards display in order: High → Medium → Low → None. When inactive, cards show in their original (drag-drop) order.

Important: never sort the `cards` array from state directly. Derive a display-only sorted copy.

<details>
<summary>Answer</summary>

Add state in `Column.tsx`:
```ts
const [sortByPriority, setSortByPriority] = useState(false)
```

Derive the display order — never mutate `cards`:
```ts
const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2, none: 3 }

const displayCards = sortByPriority
  ? [...cards].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  : cards
```

Use `displayCards` in your `.map()`. Add the button to the column header:
```tsx
<button
  type="button"
  onClick={() => setSortByPriority(prev => !prev)}
  className={`text-xs px-2 py-1 rounded-lg border transition-colors
    ${sortByPriority ? 'bg-gray-800 text-white border-gray-800' : 'text-gray-400 border-gray-200 hover:bg-gray-50'}`}
>
  ↕ Priority
</button>
```

**Why `[...cards]` before `.sort()`?** `.sort()` mutates the array in place. `cards` comes directly from React state — mutating it bypasses React's update cycle and causes unpredictable bugs. Always spread to create a copy first.

</details>

---

## Chapter 2: Search & Filter

**What you're building:** A search bar in the board header that filters cards across all columns in real time as the user types.

**Concept — useEffect for synchronization**

`useEffect` runs code *after* a render, in response to a change. Its three forms:

```ts
useEffect(() => { ... })           // after every render
useEffect(() => { ... }, [])       // once on mount
useEffect(() => { ... }, [value])  // when value changes
```

The cleanup function (the return value) runs before the next effect fires — undoing what the previous effect set up:

```ts
useEffect(() => {
  const id = setTimeout(() => doSomething(), 500)
  return () => clearTimeout(id)  // cancel if value changes again within 500ms
}, [value])
```

---

**Q2.1 — Add a controlled search input to the board header**

In `Board.tsx`, add a search input to the header. It should be a **controlled input** — its value lives in state and updates on every keypress. What does "controlled" mean and why does it matter?

<details>
<summary>Answer</summary>

In `Board.tsx`:
```ts
const [searchQuery, setSearchQuery] = useState('')
```

```tsx
<input
  type="text"
  placeholder="Search cards..."
  value={searchQuery}
  onChange={e => setSearchQuery(e.target.value)}
  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 w-48"
/>
```

**Controlled vs uncontrolled:** A controlled input has its value driven by React state (`value={searchQuery}`). An uncontrolled input stores its value in the DOM itself. Controlled inputs are the React way — the state is the single source of truth, and the UI reflects it. This makes it easy to read the value, reset it, or sync it elsewhere.

</details>

---

**Q2.2 — Pass the search query down to Column**

`Board.tsx` owns the search state, but `Column.tsx` needs it to filter cards. Pass `searchQuery` as a prop to `Column`. Update Column's prop type.

<details>
<summary>Answer</summary>

In `Board.tsx`:
```tsx
<Column ... searchQuery={searchQuery} />
```

In `Column.tsx`, add to props:
```ts
export default function Column({ ..., searchQuery }: { ..., searchQuery: string }) {
```

</details>

---

**Q2.3 — Filter the displayed cards**

In `Column.tsx`, derive a filtered list of cards based on `searchQuery`. A card should show if its `title` or `tag` contains the query (case-insensitive). If the query is empty, show all cards.

This is derived state — compute it directly, don't store it in `useState`.

<details>
<summary>Answer</summary>

```ts
const filteredCards = searchQuery
  ? cards.filter(card =>
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.tag.toLowerCase().includes(searchQuery.toLowerCase())
    )
  : cards
```

Use `filteredCards` (and then sort it if `sortByPriority` is active) in your `.map()`:
```ts
const displayCards = sortByPriority
  ? [...filteredCards].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  : filteredCards
```

**Key insight:** `filteredCards` is a derived value — computed from props, not stored in state. There is no `setFilteredCards`. Every render recomputes it from the latest `searchQuery` and `cards`. This is intentional and correct.

</details>

---

**Q2.4 — Debounce the filter with useEffect**

Right now filtering runs on every single keypress. Use `useEffect` to debounce it: only apply the filter 300ms after the user stops typing. The input should still feel responsive — only the filter application is delayed.

<details>
<summary>Answer</summary>

In `Board.tsx`, add a second state variable for the debounced value:

```ts
const [searchQuery, setSearchQuery] = useState('')
const [debouncedQuery, setDebouncedQuery] = useState('')

useEffect(() => {
  const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
  return () => clearTimeout(timer) // cancel timer if user types again before 300ms
}, [searchQuery])
```

Pass `debouncedQuery` (not `searchQuery`) to `Column`:
```tsx
<Column ... searchQuery={debouncedQuery} />
```

The input `value={searchQuery}` so typing feels instant. Only `debouncedQuery` is delayed, so filtering waits until the user pauses.

**How cleanup works:** Every keypress fires the effect, which sees a pending timer, cancels it (cleanup), and starts a fresh 300ms timer. Only when the user stops typing for 300ms does the timer complete and `debouncedQuery` update.

</details>

---

## Chapter 3: Focus Management & Scroll

**What you're building:** Auto-focus the title input when a form opens. Auto-scroll a newly added column into view. Close forms on Escape.

**Concept — useRef**

`useRef` gives you a mutable box that persists across renders without triggering re-renders when changed. Two uses:

```ts
// 1. DOM reference — reach into the DOM imperatively
const inputRef = useRef<HTMLInputElement>(null)
<input ref={inputRef} />
inputRef.current?.focus()

// 2. Mutable value — store something without causing a re-render
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
timerRef.current = setTimeout(...)
```

The key difference from `useState`: changing `.current` never re-renders the component.

---

**Q3.1 — Auto-focus the add-card title input**

When the user clicks "+ Add card", the form appears but they still have to click the input before typing. Use `useRef` and `useEffect` to auto-focus the title input the moment the form appears.

<details>
<summary>Answer</summary>

In `Column.tsx`:
```ts
import { useRef, useEffect } from 'react'

const titleInputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  if (isAdding) titleInputRef.current?.focus()
}, [isAdding])
```

Attach the ref to the input:
```tsx
<input ref={titleInputRef} id="cardTitle" ... />
```

**Why `useEffect` and not inline?** When `isAdding` becomes `true`, the input doesn't exist in the DOM yet — React schedules a re-render first. `useEffect` runs *after* the DOM updates, so the input is guaranteed to be mounted when `.focus()` is called. Calling `.focus()` inline would fire before the input exists.

**Why `?.`?** `titleInputRef.current` is `null` until the element mounts. The optional chain prevents a crash if the effect runs before the input is in the DOM.

</details>

---

**Q3.2 — Auto-scroll a new column into view**

When the user adds a column, if many columns exist, the new one is off-screen to the right. Use `useRef` on a scroll anchor at the end of the columns list, and `useEffect` watching `columns.length` to scroll it into view.

<details>
<summary>Answer</summary>

In `Board.tsx`:
```ts
import { useRef, useEffect } from 'react'

const columnsEndRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  columnsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' })
}, [columns.length])
```

Add an invisible scroll anchor after the columns list:
```tsx
<ul className="flex gap-6 items-start px-8 pb-8">
  {columns.map(column => (...))}
</ul>
<div ref={columnsEndRef} />
```

`scrollIntoView` is an imperative browser API — it can't be expressed as React state. This is exactly the use case `useRef` was designed for: calling a DOM method that React doesn't control.

</details>

---

**Q3.3 — Close forms with the Escape key**

Add a keyboard listener so pressing `Escape` closes the add-card form (if open) or the edit form (if open). Use `useEffect` with the correct dependency array to avoid stale closures.

<details>
<summary>Answer</summary>

In `Column.tsx`:
```ts
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (isAdding) handleCancelCard()
      if (cardId !== null) setCardId(null)
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [isAdding, cardId])
```

**Why list `isAdding` and `cardId` in deps?** The handler function references those values. Without them in the dependency array, the effect captures their initial values (stale closure) — pressing Escape might do nothing because `isAdding` is always `false` inside the handler. Adding them ensures the listener is re-registered with fresh values whenever they change. The cleanup removes the old listener before registering the new one.

</details>

---

## Chapter 4: Stats Bar with Performance Optimization

**What you're building:** A stats bar at the top showing total cards, high-priority cards, and completion rate. Then optimize it so unchanged columns don't re-render unnecessarily.

**Concept — useMemo, useCallback, React.memo**

React re-renders a component whenever its state or props change. Three tools help control this:

- **`React.memo`** — skips re-rendering a component if its props haven't changed (shallow comparison)
- **`useCallback`** — memoizes a function so it keeps the same reference across renders
- **`useMemo`** — memoizes a computed value so it's not recalculated on every render

These only help when used together: `React.memo` is defeated by new function/object references in props, so you need `useCallback`/`useMemo` to stabilize those references.

---

**Q4.1 — Build the StatsBar component**

Create `src/components/StatsBar.tsx`. It receives `columns` as a prop and displays:
- Total cards across all columns
- Number of high-priority cards
- Completion percentage (cards in the "Done" column ÷ total × 100)

Add it to `Board.tsx` below the header.

<details>
<summary>Answer</summary>

Create `src/components/StatsBar.tsx`:
```tsx
import type { Column } from '../types'

export default function StatsBar({ columns }: { columns: Column[] }) {
  const total = columns.reduce((sum, col) => sum + col.cards.length, 0)
  const highPriority = columns.flatMap(col => col.cards).filter(c => c.priority === 'high').length
  const doneColumn = columns.find(col => col.title === 'Done')
  const doneCount = doneColumn?.cards.length ?? 0
  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0

  return (
    <div className="flex gap-6 px-8 pb-4 text-sm text-gray-500">
      <span><strong className="text-gray-800">{total}</strong> cards total</span>
      <span><strong className="text-red-500">{highPriority}</strong> high priority</span>
      <span><strong className="text-green-600">{completionRate}%</strong> complete</span>
    </div>
  )
}
```

In `Board.tsx`, add below the header div:
```tsx
<StatsBar columns={columns} />
```

</details>

---

**Q4.2 — Memoize the stats calculation with useMemo**

The stats recalculate on every render of `StatsBar`. Wrap the three calculations in a single `useMemo` call that returns an object `{ total, highPriority, completionRate }`.

After implementing it, reflect: is this `useMemo` actually necessary for your Kanban board's scale?

<details>
<summary>Answer</summary>

```ts
import { useMemo } from 'react'

const stats = useMemo(() => {
  const total = columns.reduce((sum, col) => sum + col.cards.length, 0)
  const highPriority = columns.flatMap(col => col.cards).filter(c => c.priority === 'high').length
  const doneColumn = columns.find(col => col.title === 'Done')
  const completionRate = total > 0 ? Math.round(((doneColumn?.cards.length ?? 0) / total) * 100) : 0
  return { total, highPriority, completionRate }
}, [columns])
```

**Is it worth it?** For 3 columns and 20 cards, these operations take microseconds. The `useMemo` call itself has overhead. For this scale: not worth it.

It becomes valuable when:
- Computing over thousands of items
- The result is passed as a prop to a `React.memo` component (requires stable reference)
- Profiling (React DevTools → Profiler tab) shows the calculation is a bottleneck

**Rule: profile first, optimize second.**

</details>

---

**Q4.3 — Prevent Column from re-rendering when other columns change**

Open React DevTools → Components → settings gear → enable "Highlight updates when components render." Add a card to column 1. All three `Column` components flash — even columns 2 and 3 which didn't change.

Wrap `Column` in `React.memo`. Test again — does it work? If not, figure out why and fix it.

<details>
<summary>Answer</summary>

In `Column.tsx`:
```ts
import { memo } from 'react'
export default memo(function Column({ ... }) { ... })
```

**Why it still doesn't work:** `Board.tsx` passes handlers as props:
```tsx
<Column onAddCard={onAddCard} onDeleteCard={onDeleteCard} ... />
```

These functions are recreated on every render of `App`. `React.memo` does a shallow reference comparison — since function references are new every render, it always sees "props changed" and re-renders anyway.

**Fix:** Wrap handlers in `useCallback` in `App.tsx`, using the functional update form so `columns` isn't needed as a dependency:

```ts
const handleAddCard = useCallback((columnId: number, newCard: CardType) => {
  setColumns(prev => prev.map(col =>
    col.id === columnId
      ? { ...col, cards: [...col.cards, newCard] }
      : col
  ))
}, []) // empty deps — setColumns is stable, prev is always fresh
```

Apply the same pattern to all handlers. Now check DevTools again — only the affected column should flash.

**Why empty deps work:** `setColumns` is guaranteed stable by React (same reference forever). Using `prev =>` (functional update) means we never read `columns` directly inside the callback — so it's not a dependency.

</details>

---

## Chapter 5: Full Undo/Redo System

**What you're building:** Replace the 5-second undo toast with a proper undo/redo system — Ctrl+Z and Ctrl+Y, with visible buttons in the header.

**Concept — useReducer**

`useReducer` is an alternative to `useState` for complex state. Instead of calling many setters, you dispatch a single **action** and a **reducer** computes the new state:

```ts
function reducer(state, action) {
  switch (action.type) {
    case 'increment': return state + 1
    case 'reset':     return 0
    default:          return state
  }
}

const [count, dispatch] = useReducer(reducer, 0)
dispatch({ type: 'increment' })
```

A reducer is a **pure function** — same input always produces same output, no side effects. This makes it easy to test, debug, and build history on top of.

---

**Q5.1 — Understand the history data structure**

Before writing code, understand what data you need. The undo/redo pattern uses three pieces:
- `past` — array of previous states (oldest → newest)
- `present` — the current state
- `future` — array of undone states (most recent → oldest)

Trace through this sequence on paper: start with 3 cards, add a 4th, delete the 2nd, undo, undo, redo. What does `past`/`present`/`future` look like at each step?

<details>
<summary>Answer</summary>

```
Start:    past=[]                  present=[A,B,C]    future=[]

Add D:    past=[[A,B,C]]           present=[A,B,C,D]  future=[]

Delete B: past=[[A,B,C],[A,B,C,D]] present=[A,C,D]    future=[]

Undo:     past=[[A,B,C]]           present=[A,B,C,D]  future=[[A,C,D]]

Undo:     past=[]                  present=[A,B,C]    future=[[A,C,D],[A,B,C,D]]

Redo:     past=[[A,B,C]]           present=[A,B,C,D]  future=[[A,C,D]]
```

Rules:
- Any new action: push `present` to `past`, set new state as `present`, clear `future`
- Undo: pop last from `past` → new `present`, push old `present` to `future`
- Redo: pop first from `future` → new `present`, push old `present` to `past`

</details>

---

**Q5.2 — Build a useHistory custom hook**

Create `src/hooks/useHistory.ts`. The hook takes an initial value and returns `[present, set, { undo, redo, canUndo, canRedo }]`.

Internally it uses `useReducer` with three action types: `'SET'`, `'UNDO'`, `'REDO'`.

<details>
<summary>Answer</summary>

```ts
import { useReducer } from 'react'

type HistoryState<T> = { past: T[]; present: T; future: T[] }
type HistoryAction<T> =
  | { type: 'SET'; newPresent: T }
  | { type: 'UNDO' }
  | { type: 'REDO' }

function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  const { past, present, future } = state
  switch (action.type) {
    case 'SET':
      if (action.newPresent === present) return state
      return { past: [...past, present], present: action.newPresent, future: [] }
    case 'UNDO': {
      if (!past.length) return state
      const previous = past[past.length - 1]
      return { past: past.slice(0, -1), present: previous, future: [present, ...future] }
    }
    case 'REDO': {
      if (!future.length) return state
      const next = future[0]
      return { past: [...past, present], present: next, future: future.slice(1) }
    }
    default: return state
  }
}

export function useHistory<T>(initialValue: T) {
  const [state, dispatch] = useReducer(historyReducer<T>, {
    past: [], present: initialValue, future: []
  })
  return [
    state.present,
    (newPresent: T) => dispatch({ type: 'SET', newPresent }),
    {
      undo: () => dispatch({ type: 'UNDO' }),
      redo: () => dispatch({ type: 'REDO' }),
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    }
  ] as const
}
```

</details>

---

**Q5.3 — Replace useState with useHistory in App.tsx**

Replace `const [columns, setColumns] = useState(...)` with `useHistory`. Every existing `setColumns` call automatically records a history entry. Remove the undo toast feature — this replaces it.

<details>
<summary>Answer</summary>

```ts
import { useHistory } from './hooks/useHistory'

const [columns, setColumns, { undo, redo, canUndo, canRedo }] = useHistory<ColumnType[]>(initialColumns)
```

Every `setColumns(newValue)` call now pushes the previous state to history. No changes needed to any handler functions — they already call `setColumns`.

Remove: the `undoItem` state, `undoTimerRef`, `handleUndo`, and the `<Toast>` render. Also remove `UndoItem` import.

Pass `{ undo, redo, canUndo, canRedo }` to `Board` as props.

</details>

---

**Q5.4 — Add Undo/Redo buttons and keyboard shortcuts**

Add Undo (↩) and Redo (↪) buttons to the board header. Disable them when there's nothing to undo/redo. Also add Ctrl+Z / Ctrl+Y keyboard shortcuts via `useEffect`.

<details>
<summary>Answer</summary>

In `Board.tsx` header:
```tsx
<div className="flex gap-2">
  <button
    onClick={onUndo}
    disabled={!canUndo}
    className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
  >
    ↩ Undo
  </button>
  <button
    onClick={onRedo}
    disabled={!canRedo}
    className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
  >
    ↪ Redo
  </button>
</div>
```

Keyboard shortcuts in `App.tsx`:
```ts
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey
    if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
    if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [undo, redo])
```

`disabled:opacity-30` greys out the button visually. `disabled:cursor-not-allowed` changes the cursor. Both are Tailwind variants that apply when the `disabled` HTML attribute is present.

</details>

---

## Chapter 6: Custom Hooks — Extract & Reuse

**What you're building:** Extract the repeated form logic into a `useCardForm` hook. After this chapter, both the add-card and edit-card forms share the same logic — and `Column.tsx` shrinks significantly.

**Concept — Custom Hooks**

A custom hook is a function starting with `use` that calls other hooks. It's not a special React feature — it's a convention for extracting stateful logic.

```ts
// Before — logic mixed into component
function SearchBox() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  useEffect(() => { fetchResults(query).then(setResults) }, [query])
  return <input value={query} onChange={e => setQuery(e.target.value)} />
}

// After — logic extracted
function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  useEffect(() => { fetchResults(query).then(setResults) }, [query])
  return { query, setQuery, results }
}

function SearchBox() {
  const { query, setQuery, results } = useSearch()
  return <input value={query} onChange={e => setQuery(e.target.value)} />
}
```

**Rule:** If the same stateful logic appears in two places, extract it into a custom hook.

---

**Q6.1 — Build useCardForm**

`Column.tsx` has 5 state variables just for the add-card form: `title`, `tag`, `selectedColorValue`, `selectedFontValue`, `selectedPriority`, plus the `addColorHandler` and `handleCancelCard` logic.

Create `src/hooks/useCardForm.ts` that encapsulates all of this. It should return everything the form needs: the values, the setters, `addColorHandler`, `reset`, and `colorOptions`.

<details>
<summary>Answer</summary>

```ts
import { useState } from 'react'
import type { Priority } from '../types'

export const colorOptions = [
  { name: 'blue', bgColor: 'bg-blue-100', fontColor: 'text-blue-950', swatchColor: 'bg-blue-200' },
  { name: 'purple', bgColor: 'bg-purple-100', fontColor: 'text-purple-950', swatchColor: 'bg-purple-200' },
  { name: 'green', bgColor: 'bg-green-100', fontColor: 'text-green-950', swatchColor: 'bg-green-200' },
  { name: 'red', bgColor: 'bg-red-100', fontColor: 'text-red-950', swatchColor: 'bg-red-200' },
]

type InitialValues = {
  title?: string
  tag?: string
  bgcolor?: string
  priority?: Priority
}

export function useCardForm(initialValues?: InitialValues) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [tag, setTag] = useState(initialValues?.tag ?? '')
  const [selectedColorValue, setSelectedColorValue] = useState(initialValues?.bgcolor ?? 'bg-blue-100')
  const [selectedFontValue, setSelectedFontValue] = useState('text-blue-950')
  const [priority, setPriority] = useState<Priority>(initialValues?.priority ?? 'none')

  function addColorHandler(bgColor: string) {
    const picked = colorOptions.find(o => o.bgColor === bgColor)
    setSelectedColorValue(bgColor)
    setSelectedFontValue(picked?.fontColor ?? 'text-blue-950')
  }

  function reset() {
    setTitle(initialValues?.title ?? '')
    setTag(initialValues?.tag ?? '')
    setSelectedColorValue(initialValues?.bgcolor ?? 'bg-blue-100')
    setSelectedFontValue('text-blue-950')
    setPriority(initialValues?.priority ?? 'none')
  }

  return { title, tag, selectedColorValue, selectedFontValue, priority, setTitle, setTag, addColorHandler, setPriority, reset, colorOptions }
}
```

In `Column.tsx`, replace the 5 state variables and `addColorHandler` with:
```ts
const form = useCardForm()
```

Then use `form.title`, `form.reset()`, `form.addColorHandler(...)` etc.

</details>

---

**Q6.2 — Reuse useCardForm in EditableForm**

`EditForm.tsx` has its own separate form state. Since it's the same shape as the add-card form, use `useCardForm` there too — but initialized with the card's existing values.

<details>
<summary>Answer</summary>

In `EditForm.tsx`:
```ts
import { useCardForm } from '../hooks/useCardForm'

const form = useCardForm({
  title: card.title,
  tag: card.tag,
  bgcolor: card.bgcolor,
  priority: card.priority,
})
```

Replace `newCardTitle`, `newCardTag`, `editedSelectedColorValue` with `form.title`, `form.tag`, `form.selectedColorValue`.

Replace the color handler with `form.addColorHandler`.

In `onSubmit`:
```ts
onEditCard(columnId, card.id, form.title, form.tag, form.selectedColorValue, colorOptions)
```

**This is why custom hooks exist:** the same stateful logic appeared in two components. Extracting it means a bug fix or enhancement in one place fixes both. The add-card form and edit form now always behave identically.

</details>

---

**Q6.3 — Build useDebounce**

Create `src/hooks/useDebounce.ts`. It takes a value and a delay in milliseconds, and returns a debounced version of the value that only updates after the delay has passed without another change.

Then use it in `Board.tsx` to replace the manual debounce from Chapter 2.

<details>
<summary>Answer</summary>

```ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
```

In `Board.tsx`, replace the manual `useEffect` debounce:
```ts
import { useDebounce } from '../hooks/useDebounce'

const [searchQuery, setSearchQuery] = useState('')
const debouncedQuery = useDebounce(searchQuery, 300)
```

Remove the manual `debouncedQuery` state and its `useEffect`. The hook encapsulates that pattern. Pass `debouncedQuery` to `Column` as before.

</details>

---

## Chapter 7: Board Settings with Context

**What you're building:** Dark/light mode toggle and a "show empty columns" toggle. Settings persist to localStorage and are available to any component without prop drilling.

**Concept — Context API**

Context solves prop drilling — passing data through components that don't use it just to reach a deeply nested child:

```
Without context:               With context:
App (has data)                 App (provides context)
└── Board (passes it along)      └── Board (doesn't need it)
    └── Column (passes it)           └── Column (reads directly)
        └── Card (uses it)               └── Card (uses it)
```

Three steps:
1. `createContext` — create the context
2. `<Context.Provider value={...}>` — provide it to a subtree
3. `useContext(Context)` — consume it in any descendant

---

**Q7.1 — Create a SettingsContext**

Create `src/context/SettingsContext.tsx`. It should provide `darkMode`, `showEmptyColumns`, `toggleDarkMode`, and `toggleShowEmptyColumns`. Settings should persist to localStorage separately from board data.

Export both a `SettingsProvider` component and a `useSettings` hook. The hook should throw a clear error if called outside the provider.

<details>
<summary>Answer</summary>

```tsx
import { createContext, useContext, useState, useEffect } from 'react'

type Settings = { darkMode: boolean; showEmptyColumns: boolean }
type SettingsContextType = Settings & {
  toggleDarkMode: () => void
  toggleShowEmptyColumns: () => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('settings')
    return saved ? JSON.parse(saved) : { darkMode: false, showEmptyColumns: true }
  })

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings))
  }, [settings])

  return (
    <SettingsContext.Provider value={{
      ...settings,
      toggleDarkMode: () => setSettings(s => ({ ...s, darkMode: !s.darkMode })),
      toggleShowEmptyColumns: () => setSettings(s => ({ ...s, showEmptyColumns: !s.showEmptyColumns })),
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

// Custom hook with guard — throws a clear error if used outside the provider
export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
```

**Why throw instead of providing a default?** If you provide fake default functions, a component that accidentally calls `useSettings()` outside the provider silently gets broken behaviour. Throwing gives you an immediate, clear error pointing to the exact problem.

</details>

---

**Q7.2 — Wrap the app and apply dark mode**

Wrap your app in `<SettingsProvider>` in `main.tsx`. Then use `useSettings()` in `App.tsx` to apply dark/light background classes based on `darkMode`.

<details>
<summary>Answer</summary>

In `main.tsx`:
```tsx
import { SettingsProvider } from './context/SettingsContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </React.StrictMode>
)
```

In `App.tsx`:
```ts
const { darkMode } = useSettings()

return (
  <main className={`min-h-screen p-8 transition-colors ${darkMode ? 'bg-gray-900' : 'bg-slate-100'}`}>
```

</details>

---

**Q7.3 — Add a dark mode toggle button**

Add a toggle button to `Board.tsx` header. It should not receive `toggleDarkMode` as a prop — read it directly from `useSettings()`. This is the point of context.

<details>
<summary>Answer</summary>

In `Board.tsx` — no prop needed:
```ts
import { useSettings } from '../context/SettingsContext'

const { darkMode, toggleDarkMode } = useSettings()
```

```tsx
<button
  onClick={toggleDarkMode}
  className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
>
  {darkMode ? '☀️ Light' : '🌙 Dark'}
</button>
```

`Board.tsx` doesn't receive `toggleDarkMode` as a prop — it reads it directly from context. This is the core benefit: any component anywhere in the tree accesses settings without the parent needing to pass them down.

</details>

---

**Q7.4 — Hide empty columns using context**

Use `showEmptyColumns` from `useSettings()` in `Board.tsx` to filter out columns with no cards when the toggle is off. Add a toggle button to the header.

<details>
<summary>Answer</summary>

In `Board.tsx`:
```ts
const { showEmptyColumns, toggleShowEmptyColumns } = useSettings()

const visibleColumns = showEmptyColumns
  ? columns
  : columns.filter(col => col.cards.length > 0)
```

Map over `visibleColumns` instead of `columns`. The original data is untouched — this is display filtering only, not a state change.

Toggle button:
```tsx
<button onClick={toggleShowEmptyColumns} className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
  {showEmptyColumns ? 'Hide empty' : 'Show all'}
</button>
```

</details>

---

## Chapter 8: Card Detail Modal

**What you're building:** Click any card to open a full-screen modal showing its details. The modal renders via a Portal (outside the main DOM tree) and closes on overlay click or Escape.

**Concept — Portals**

By default, React renders components inside their parent DOM node. A **portal** renders into a completely different DOM node — usually `document.body`:

```tsx
ReactDOM.createPortal(children, document.body)
```

The component still behaves like a normal React child (context works, events bubble up), but it escapes any CSS constraints (overflow, z-index, transforms) of its parent. This is essential for modals, tooltips, and toasts — they need to sit above everything else on the page.

---

**Q8.1 — Add a description field to cards**

Extend the `Card` type with an optional `description` field. Update `EditableForm` to include a description textarea. Existing cards without a description should still work.

<details>
<summary>Answer</summary>

In `types.ts`:
```ts
export interface Card {
  id: number
  title: string
  tag: string
  bgcolor: string
  fontcolor: string
  priority: Priority
  description?: string  // optional — existing cards remain valid
}
```

Making it optional (`?`) means existing cards without this field pass TypeScript validation. When reading it: `card.description ?? ''`.

In `useCardForm.ts`, add description to state:
```ts
const [description, setDescription] = useState(initialValues?.description ?? '')
```

Return it and include it in `reset()`.

In `EditForm.tsx`, add a textarea:
```tsx
<label>
  Description:
  <textarea
    value={form.description}
    onChange={e => form.setDescription(e.target.value)}
    rows={3}
    placeholder="Add more detail..."
    className="w-full rounded-lg border border-gray-200 p-2 text-sm mt-1"
  />
</label>
```

</details>

---

**Q8.2 — Build a Modal component using a Portal**

Create `src/components/Modal.tsx`. It should:
- Render its children into `document.body` via a portal
- Show a dark semi-transparent overlay
- Close when the overlay is clicked
- Close when Escape is pressed
- Prevent the page from scrolling while open

<details>
<summary>Answer</summary>

```tsx
import { useEffect } from 'react'
import ReactDOM from 'react-dom'

export default function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
```

**Why `e.stopPropagation()` on the inner div?** Clicking inside the modal panel bubbles up to the overlay div, which would trigger `onClose`. `stopPropagation` stops the event from reaching the overlay so only clicking outside the panel closes it.

**Why Portal?** Without it, the modal is nested inside a column `<li>` which may have `overflow: hidden` or `position: relative`. These CSS properties would clip the overlay or break the z-index stacking. The portal renders directly in `document.body`, escaping all parent CSS constraints.

</details>

---

**Q8.3 — Open the modal when a card title is clicked**

In `Column.tsx`, add state to track which card's detail is open. Make the card title clickable. When clicked, show the `Modal` with the card's details — title, description, tag, priority, and creation date.

<details>
<summary>Answer</summary>

In `Column.tsx`:
```ts
const [detailCard, setDetailCard] = useState<CardType | null>(null)
```

Make the card title a button:
```tsx
<button
  onClick={() => setDetailCard(card)}
  className="text-sm font-medium text-gray-800 mb-2 text-left hover:text-blue-600 transition-colors w-full"
>
  {card.title}
</button>
```

Render the modal at the bottom of the return:
```tsx
{detailCard && (
  <Modal onClose={() => setDetailCard(null)}>
    <h2 className="text-lg font-semibold mb-3">{detailCard.title}</h2>
    {detailCard.description && (
      <p className="text-sm text-gray-600 mb-4">{detailCard.description}</p>
    )}
    <div className="flex gap-2 flex-wrap">
      {detailCard.tag && (
        <Tag tag={detailCard.tag} bgcolor={detailCard.bgcolor} fontcolor={detailCard.fontcolor} />
      )}
      {detailCard.priority !== 'none' && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${priorityStyles[detailCard.priority]}`}>
          {detailCard.priority}
        </span>
      )}
    </div>
    <button
      onClick={() => setDetailCard(null)}
      className="mt-4 text-sm text-gray-400 hover:text-gray-600"
    >
      Close
    </button>
  </Modal>
)}
```

</details>

---

*End of roadmap. Each chapter delivers a working feature. The patterns — useState, useEffect, useRef, useCallback, useMemo, useReducer, custom hooks, context, portals — were tools you used to build something real, not concepts you read about in isolation.*

*Continue with `ROADMAP.md` for the Redux migration path.*

import { useEffect, useRef, useState } from 'react'
import Board from './components/Board'
import Toast from './components/Toast'
import type { Column as ColumnType, Card as CardType, ColorOption, UndoItem } from './types'
import { DragDropContext } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'

function App() {
    // Load columns from localStorage on first render; fall back to hardcoded data if nothing is saved
    const [columns, setColumns] = useState<ColumnType[]>(() => {    const saved = localStorage.getItem('columns')
    return saved ? JSON.parse(saved) : [
    {
        id: 1,
        title: 'To do',
        cards: [
          { id: 4, title: 'Set up Vite project', tag: 'Setup', bgcolor: 'bg-blue-100', fontcolor: 'text-blue-950' },
          { id: 5, title: 'Design Card component', tag: 'UI', bgcolor: 'bg-purple-100', fontcolor: 'text-purple-950' },
          { id: 6, title: 'Wire up localStorage', tag: '', bgcolor: '', fontcolor: ''}
        ],
    },
    {
      id: 2,
      title: 'In progress',
      cards: [
        { id: 7, title: 'Build Board + Column hierarchy', tag: 'Core', bgcolor: 'bg-green-100', fontcolor: 'text-green-950'}
      ],
    },
    { id: 3,
      title: 'Done',
      cards: [
      { id: 8, title: 'Install ESLint + Prettier', tag: '', bgcolor: '', fontcolor: '' },
      ],
    },
  ]
})

// Stores the last deleted item so it can be restored by Undo
const [undoItem, setUndoItem] = useState<UndoItem | null>(null)
// Ref to the auto-dismiss timer so it can be cleared when a new deletion happens
const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

// Start a 5-second countdown to dismiss the toast whenever a new deletion happens
useEffect(() => {
  if (!undoItem) return
  if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
  undoTimerRef.current = setTimeout(() => setUndoItem(null), 5000)
  return () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current) }
}, [undoItem])

// Restores the last deleted card or column back to its original position
function handleUndo() {
  if (!undoItem) return
  if (undoItem.type === 'card') {
    setColumns(cols => cols.map(col => {
      if (col.id !== undoItem.columnId) return col
      const newCards = [...col.cards]
      newCards.splice(undoItem.index, 0, undoItem.card)
      return { ...col, cards: newCards }
    }))
  } else {
    setColumns(cols => {
      const newColumns = [...cols]
      newColumns.splice(undoItem.index, 0, undoItem.column)
      return newColumns
    })
  }
  setUndoItem(null)
}


function handleAddCard(columnId: number, newCard: CardType){
  const updateColumns = columns.map((column) => {
    if(column.id === columnId){
      const updateColumn = {...column, cards: [...column.cards, newCard]}
      return updateColumn
    }
    else {
      return column
    }
  })
  setColumns(updateColumns)
}

// Adds a new empty column with a given title
function handleAddColumn(title: string) {
  const newColumn: ColumnType = {
    id: Date.now(),
    title: title,
    cards: [],
  };

  const updateParentColumns = [ ...columns, newColumn ]
  setColumns(updateParentColumns)
}

// Removes a column and all its cards by column ID
function handleDeleteColumn(columnId: number) {
  const index = columns.findIndex(col => col.id === columnId)
  const column = columns[index]
  if (column) setUndoItem({ type: 'column', column, index })
  setColumns(columns.filter(col => col.id !== columnId))
}

// Removes a single card from a specific column
function handleDeleteCard(columnId: number, cardId: number) {
  const column = columns.find(col => col.id === columnId)
  const index = column?.cards.findIndex(c => c.id === cardId) ?? -1
  const card = column?.cards[index]
  if (card && index !== -1) setUndoItem({ type: 'card', card, columnId, index })
  setColumns(columns.map(col =>
    col.id === columnId
      ? { ...col, cards: col.cards.filter(c => c.id !== cardId) }
      : col
  ))
}

// Updates a card's title, tag, background color, and font color
function handleEditCard(columnId: number, cardId:number, newCardTitle: string, newCardTag:string, newCardBgColor: string, colorOptions: ColorOption[]){
  const updatedColumns = columns.map((column) => {
    if(column.id === columnId) {
      const editedCards = column.cards.map((card) => {
        if(card.id === cardId) {
          // Find the matching color option to derive the correct font color
          const pickedColorObj = colorOptions.find((colorOption) => colorOption.bgColor === newCardBgColor)
          const pickedFontColor = pickedColorObj?.fontColor ?? card.fontcolor
          const editedCard = {...card, title: newCardTitle, tag: newCardTag, bgcolor: newCardBgColor, fontcolor: pickedFontColor }
          return (editedCard)
        }
        else {
          return card
        }
      })
      return {...column, cards: editedCards}
    }
    else {return column}
  })
  setColumns(updatedColumns)
}

// Handles card reordering when a drag ends — updates columns state so React re-renders the new order
function handleDragEnd(result: DropResult) {
  // Ignore drops outside a droppable area
  if (!result.destination) return;
  // Ignore drops where the card hasn't moved
  if (
    result.source.droppableId === result.destination.droppableId &&
    result.source.index === result.destination.index
  ) return;

  const sourceColumn = columns.find(col => col.id.toString() === result.source.droppableId);
  const destColumn = columns.find(col => col.id.toString() === result.destination!.droppableId);

  if (!sourceColumn || !destColumn) return;

  const sourceCards = [...sourceColumn.cards];
  const [removed] = sourceCards.splice(result.source.index, 1);

  if (sourceColumn.id === destColumn.id) {
    // Same-column reorder: insert the card at the new position
    sourceCards.splice(result.destination.index, 0, removed);
    setColumns(columns.map(col =>
      col.id === sourceColumn.id ? { ...col, cards: sourceCards } : col
    ));
  } else {
    // Cross-column move: remove from source, insert into destination
    const destCards = [...destColumn.cards];
    destCards.splice(result.destination.index, 0, removed);
    setColumns(columns.map(col => {
      if (col.id === sourceColumn.id) return { ...col, cards: sourceCards };
      if (col.id === destColumn.id) return { ...col, cards: destCards };
      return col;
    }));
  }
}

// Persist columns to localStorage whenever they change
useEffect(() => {
    localStorage.setItem('columns', JSON.stringify(columns) )
}, [columns])

  return (
    <>
      <main className="min-h-screen bg-slate-100 p-8">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Board columns={columns} onAddCard={handleAddCard} onAddColumn={handleAddColumn} onDeleteColumn={handleDeleteColumn} onDeleteCard={handleDeleteCard} onEditCard={handleEditCard} />
        </DragDropContext>
      </main>
      {undoItem && (
        <Toast
          message={undoItem.type === 'card' ? 'Card deleted' : 'Column deleted'}
          onUndo={handleUndo}
          onDismiss={() => setUndoItem(null)}
        />
      )}
    </>
  )
}

export default App

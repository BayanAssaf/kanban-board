import { useEffect, useState } from 'react'
import Board from './components/Board'
import type { Column as ColumnType, Card as CardType, ColorOption } from './types'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'

function App() {
    const [columns, setColumns] = useState<ColumnType[]>(() => {
    const saved = localStorage.getItem('columns')
    return saved ? JSON.parse(saved) : [
    { 
        id: 1,
        title: 'To do', 
        cards: [
          { id: 1, title: 'Set up Vite project', tag: 'Setup', bgcolor: 'bg-blue-100', fontcolor: 'text-blue-950' },
          { id: 2, title: 'Design Card component', tag: 'UI', bgcolor: 'bg-purple-100', fontcolor: 'text-purple-950' },
          { id: 3, title: 'Wire up localStorage', tag: '', bgcolor: '', fontcolor: ''}
        ],
    }, 
    { 
      id: 2,
      title: 'In progress', 
      cards: [
        { id: 1, title: 'Build Board + Column hierarchy', tag: 'Core', bgcolor: 'bg-green-100', fontcolor: 'text-green-950'}
      ],
    }, 
    { id: 3,
      title: 'Done',
      cards: [
      { id: 1, title: 'Install ESLint + Prettier', tag: '', bgcolor: '', fontcolor: '' },
      ], 
    },
  ]
})

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

function handleAddColumn(title: string) {
  const newColumn: ColumnType = {
    id: Date.now(),
    title: title,
    cards: [],
  };
  
  const updateParentColumns = [ ...columns, newColumn ]
  setColumns(updateParentColumns)

}

function handleDeleteColumn(columnId: number) {
  const updatedColumns = columns.filter((column) => {
    if(column.id !== columnId )
      return column
  })
  setColumns(updatedColumns)
}

function handleDeleteCard(columnId: number, cardId: number) {
  const updatedColumns = columns.map((column) => {
    if(column.id === columnId){
        const updatedCards = column.cards.filter((card) => card.id !== cardId)
        return {...column, cards: updatedCards}
    }
    else{
        return column
    }
})
setColumns(updatedColumns)
}

function handleEditCard(columnId: number, cardId:number, newCardTitle: string, newCardTag:string, newCardBgColor: string, colorOptions: ColorOption[]){
  const updatedColumns = columns.map((column) => {
    if(column.id === columnId) {
      const editedCards = column.cards.map((card) => {
        if(card.id === cardId) {
          const pickedColorObj = colorOptions.find((colorOption) => colorOption.bgColor === newCardBgColor)
          const pickedFontColor = pickedColorObj?.fontColor ?? card.fontcolor
          console.log('picked font color: ', pickedFontColor)
          const editedCard = {...card, title: newCardTitle, tag: newCardTag, bgcolor: newCardBgColor, fontcolor: pickedFontColor }
          console.log('edited Card: ',editedCard)
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
}

useEffect(() => {
    localStorage.setItem('columns', JSON.stringify(columns) )
}, [columns])

  return (
    <>
      <main className="min-h-screen bg-slate-100 p-8">
        <DragDropContext onDragEnd={handleDragEnd}><Board columns={columns} onAddCard={handleAddCard} onAddColumn={handleAddColumn} onDeleteColumn={handleDeleteColumn} onDeleteCard={handleDeleteCard} onEditCard={handleEditCard} /></DragDropContext>
      </main>
    </>
  )
}

export default App

import Button from './Button'
import { useState } from 'react'
import type { Card as CardType } from '../types'
import Tag from './Tag'
import type { AddCardHandler, DeleteCardHandler, EditCardHandler } from '../types'
import { FaTrashAlt, FaPencilAlt } from 'react-icons/fa'
import EditableForm from './EditForm'
import { Draggable, Droppable } from "@hello-pangea/dnd";

// Available color options for card tags — defined outside the component so it's not recreated on every render
const colorOptions = [
    { name: 'blue', bgColor: 'bg-blue-100', fontColor: 'text-blue-950', swatchColor: 'bg-blue-200' },
    { name: 'purple', bgColor: 'bg-purple-100', fontColor: 'text-purple-950', swatchColor: 'bg-purple-200' },
    { name: 'green', bgColor: 'bg-green-100', fontColor: 'text-green-950', swatchColor: 'bg-green-200' },
    { name: 'red', bgColor: 'bg-red-100', fontColor: 'text-red-950', swatchColor: 'bg-red-200' }
]

// Renders a single column: its list of cards, an add-card form, and edit/delete controls
export default function Column({ onAddCard, onEditCard, columnId, cards, onDeleteCard }:{ onAddCard: AddCardHandler, onEditCard: EditCardHandler, columnId: number, cards: CardType[], onDeleteCard: DeleteCardHandler }) {
    // Controls whether the add-card form is visible
    const [ isAdding, setIsAdding ] = useState(false)
    // Tracks the input values for the new card form
    const [ title, setTitle ] = useState('')
    const [ tag, setTag ] = useState('')
    const [ selectedColorValue, setSelectedColorValue ] = useState('bg-blue-100')
    const [ selectedFontValue, setSelectedFontValue ] = useState('text-blue-950')
    // Tracks which card is currently being edited — null means no card is in edit mode
    const [ cardId, setCardId ] = useState<number | null>(null)

    // Submits the new card to the parent and resets the form
    function handleSubmit (e:React.FormEvent) {
        e.preventDefault();
        onAddCard(columnId, {id: Date.now(), title, tag: tag, bgcolor: selectedColorValue, fontcolor: selectedFontValue });
        handleCancelCard()
    }

    // Finds the matching color option and sets both bg and font color state
    function addColorHandler(selectedBgValue:string){
        const pickedColor = colorOptions.find(colorOption => colorOption.bgColor === selectedBgValue)
        const fontColor = pickedColor?.fontColor ?? 'text-blue-950'
        setSelectedColorValue(selectedBgValue)
        setSelectedFontValue(fontColor)
    }

    // Hides the add-card form and resets all form state
    function handleCancelCard() {
        setIsAdding(false)
        setTitle('')
        setTag('')
        setSelectedColorValue('bg-blue-100')
        setSelectedFontValue('text-blue-950')
    }

    // Closes the edit form by clearing the tracked editing card ID
    function handleCancelEdit(e:React.FormEvent){
        e.preventDefault()
        setCardId(null)
    }

    return (
        <>
        <div>
            <Droppable droppableId={columnId.toString()}>
                {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef}>
                {cards.length === 0 ? null : 
                cards.map((card, index) => (
                    cardId !== card.id ? (
                    <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                        {(provided) => (
                            <li {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef} className="bg-white border border-gray-100 rounded-xl p-3 mb-2 shadow-xs">
                            <>
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-medium text-gray-800 mb-2">{card?.title}</h4>
                                <button className="flex justify-end bin-button" aria-label="Update card" onClick={() => setCardId(card.id)}>
                                    <FaPencilAlt size={12} color="#9e9e9e" />
                                </button>
                            </div>
                            <div className="pb-5">
                            {card.tag ?
                                <Tag tag={card.tag} bgcolor={card.bgcolor} fontcolor={card.fontcolor} />
                                : null} 
                            </div>
                            <div className="flex justify-end items-center">
                                <button className="flex justify-end bin-button" aria-label="Delete card" onClick={() => onDeleteCard(columnId, card.id)}>
                                    <FaTrashAlt size={12} color="#9e9e9e" />
                                </button>
                            </div>
                            </>
                        </li>
                        )}
                        </Draggable>
                        ) : (
                            <EditableForm key={card.id} onEditCard={onEditCard} columnId={columnId} card={card} colorOptions={colorOptions} onCancelEdit={handleCancelEdit} />
                        )
                        
                ))}
                {provided.placeholder}
            </ul>
            )}
            </Droppable>
        </div>
        <div>
            {isAdding ? (
                <form className=" bg-gray-50 rounded-xl p-3 border border-gray-200" onSubmit={handleSubmit}>
                    <label>
                        Title: <input id="cardTitle" className="w-full rounded-lg border border-gray-200 p-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-blue-300" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </label>
                    <label>
                        Tag: <input id="cardTag" className="w-full rounded-lg border border-gray-200 p-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-blue-300" value={tag} onChange={(e) => setTag(e.target.value)} />
                    </label>
                    <label className="pr-2">Color: &nbsp;
                        <ul className="flex flex-row gap-2 flex-wrap inline-flex items-baseline pt-3">
                            {colorOptions.map((colorOption) => (
                                <li key={colorOption.name}><button type="button" className={`w-4 h-4 rounded-full ${colorOption.swatchColor} ${selectedColorValue === colorOption.bgColor ? 'ring-2 ring-offset-1 ring-gray-500' : ''}`} onClick={() => addColorHandler(colorOption.bgColor)}></button></li>
                            ))}
                        </ul>
                    </label>
                    <div className="flex gap-2 p-3 pt-5">
                        <button className="border border-gray-300 text-sm rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50">Submit</button>
                        <button type="button" className="border border-gray-300 text-sm rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50" onClick={() => handleCancelCard()}>Cancel</button>
                    </div>
                </form>
            ) : (
                <Button onClick={() => setIsAdding(true)}>+ Add card</Button>
            )}
        </div>
        </>
    )
}
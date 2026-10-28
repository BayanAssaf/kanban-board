import { useState } from "react";
import Column from './Column'
import Button from './Button'
import type { Column as ColumnType } from '../types'
import type { AddCardHandler, AddColumnHandler, DeleteColumnHandler, DeleteCardHandler, EditCardHandler } from '../types'
import { FaTrashAlt } from 'react-icons/fa';

// Renders the full board: header with add-column form, and the list of columns
export default function Board({columns, onAddCard, onAddColumn, onDeleteColumn, onDeleteCard, onEditCard}:{columns: ColumnType[], onAddCard: AddCardHandler, onAddColumn: AddColumnHandler, onDeleteColumn: DeleteColumnHandler, onDeleteCard: DeleteCardHandler, onEditCard: EditCardHandler}) {
    // Controls whether the add-column form is visible
    const [ isAddingColumn, setIsAddingColumn ] = useState(false)
    const [ title, setTitle ] = useState('')

    // Submits the new column title to the parent and resets the form
    function handleFormSubmit (e:React.FormEvent) {
        e.preventDefault();
        onAddColumn(title)
        handleCancelColumn()
    }

    // Hides the add-column form and clears the input
    function handleCancelColumn() {
        setIsAddingColumn(false)
        setTitle('')
    }

    return (
        <>
        <div className="max-width-9/10">
            <div className="flex flex-row items-center justify-between w-full px-8 py-6">
                <h1 className="max-w-screen-lg max-w-screen-md max-w-screen-sm max-w-full flex-basis-xs text-2xl font-bold text-black-600">Kanban Board</h1>
                
                <div>
                    {isAddingColumn? 
                    <form className="bg-gray-50 rounded-xl p-3 border border-gray-200" onSubmit={handleFormSubmit}>
                        <label>
                            Title: <input id="inputTitle" className="w-full rounded-lg border border-gray-200 p-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-blue-300" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </label>
                        <div className="flex gap-2 justify-start">
                            <button className="border border-gray-300 text-sm rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50">Submit</button>
                            <button type="button" className="border border-gray-300 text-sm rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50" onClick={() => handleCancelColumn()}>Cancel</button>
                        </div>
                    </form>
                    : <div className="border border-solid border-gray-100 rounded-xl p-4"><Button onClick={()=> setIsAddingColumn(true)}>+ Add column</Button></div>
                    }
                </div>
            </div>
            <ul className="flex gap-6 items-start px-8 pb-8">
                    {columns.map ((column) => (
                        <li className="bg-white rounded-2xl shadow-sm p-4 w-72" key={column.id}>
                            <div className="flex justify-between items-center">
                                <h3 className="flex text-black dark:text-white mt-5 text-base font-medium tracking-tight relative pt-4 pb-4">{column.title}</h3>
                                <button className="flex justify-end bin-button" aria-label="Delete column" onClick={() => onDeleteColumn(column.id)}>
                                    <FaTrashAlt size={12} color="#9e9e9e" />
                                </button>
                            </div>
                            <Column onAddCard={onAddCard} onEditCard={onEditCard} onDeleteCard={onDeleteCard} columnId={column.id} cards={column.cards} />
                        </li>
                    ))}
                </ul>
        </div>
        </>
    );
}
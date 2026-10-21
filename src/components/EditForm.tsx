import {useState} from 'react'
import type { EditCardHandler } from '../types'
import type { Card as CardType, ColorOption, OnEditCancel } from '../types'

export default function EditableForm({ onEditCard, columnId, card, colorOptions, onCancelEdit }: { onEditCard: EditCardHandler, columnId: number, card: CardType, colorOptions: ColorOption[], onCancelEdit: OnEditCancel }) {
    const [ newCardTitle, setNewCardTitle] = useState(card.title)
    const [ newCardTag, setNewCardTag] = useState(card.tag)
    const [ editedSelectedColorValue, setEditedSelectedColorValue ] = useState(card.bgcolor)

    function addEditedColorHandler(selectedBgValue:string){
        console.log('edit form color: ', selectedBgValue)
        setEditedSelectedColorValue(selectedBgValue)
    }

    return (
        <form className="bg-gray-50 rounded-xl p-3 border border-gray-200" onSubmit={(e:React.FormEvent) => {e.preventDefault(), onEditCard(columnId, card.id, newCardTitle, newCardTag, editedSelectedColorValue, colorOptions), onCancelEdit(e)}}>
            <label>Title: <textarea id="title" className="w-full rounded-lg border border-gray-200 p-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-blue-300" value={newCardTitle} onChange={(e) => setNewCardTitle(e.target.value)} /></label>
            <label>Tags: <textarea id="tags" className="w-full rounded-lg border border-gray-200 p-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-blue-300" value={newCardTag} onChange={(e) => setNewCardTag(e.target.value)} /></label>
            <label className="pr-2">Color: &nbsp;
                <ul className="flex flex-row gap-2 flex-wrap inline-flex items-baseline pt-3">
                    {colorOptions.map((colorOption) => {
                       return (
                        <li key={colorOption.name}><button type="button" className={`w-4 h-4 rounded-full ${colorOption.swatchColor} ${(colorOption.bgColor === editedSelectedColorValue) ? 'ring-2 ring-offset-1 ring-gray-500' : ''}`} onClick={() => addEditedColorHandler(colorOption.bgColor)}></button></li>
                       )
                    })}
                </ul>
            </label>
            <div className="flex gap-2 p-3 pt-5 justify-center">
                <button className="border border-gray-300 text-sm rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50">Submit</button>
                <button type="button" className="border border-gray-300 text-sm rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50" onClick={(e) => onCancelEdit(e)}>Cancel</button>
            </div>
        </form>
    )
}
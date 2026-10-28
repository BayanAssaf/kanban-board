// Fixed-position notification shown after a deletion, with an Undo button
export default function Toast({ message, onUndo, onDismiss }: { message: string, onUndo: () => void, onDismiss: () => void }) {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm rounded-xl px-5 py-3 flex items-center gap-4 shadow-lg z-50">
            <span>{message}</span>
            <button onClick={onUndo} className="text-blue-300 hover:text-blue-200 font-medium transition-colors">Undo</button>
            <button onClick={onDismiss} className="text-gray-400 hover:text-gray-200 transition-colors">✕</button>
        </div>
    )
}

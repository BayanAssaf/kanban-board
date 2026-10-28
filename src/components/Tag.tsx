// Displays a colored pill tag on a card — bgcolor and fontcolor are Tailwind classes passed from card data
export default function Tag({bgcolor, fontcolor, tag, className = ''}:{ bgcolor: string, fontcolor: string, tag: string, className?: string }) {
    return (
        <>
        <div className={`text-left ${className}`}>
            <span className={`${bgcolor} ${fontcolor} text-xs p-1 rounded-lg`}>{tag}</span>
        </div>
        </>
    )
}
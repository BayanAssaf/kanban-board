export default function Tag({bgcolor, fontcolor, tag, className = ''}:{ bgcolor: string, fontcolor: string, tag: string, className?: string }) {
    return (
        <>
        {console.log(fontcolor)}
        <div className={`text-left ${className}`}>
            <span className={`${bgcolor} ${fontcolor} text-xs p-1 rounded-lg`}>{tag}</span>
        </div>
        </>
    )
}
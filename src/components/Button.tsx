import React from 'react'

export default function Button({ onClick, children }:{ onClick: ()=> void, children: React.ReactNode }){
    return(
        <button onClick={onClick} className="border border-gray-100 rounded-xl text-sm hover:text-gray-600 w-full text-center mt-2 p-2">{children}</button>
    );
}
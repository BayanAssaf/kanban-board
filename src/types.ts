export interface Card {
    id: number;
    title: string;
    tag: string;
    bgcolor: string;
    fontcolor: string;
}

export interface Column {
    id: number;
    title: string;
    cards: Card[];
}

export interface ColorOption {
    name: string;
    bgColor: string;
    fontColor: string;
    swatchColor: string;
}

export type AddCardHandler = (columnId: number, newCard: Card) => void

export type AddColumnHandler = (title: string) => void

export type DeleteColumnHandler = (columnId: number) => void

export type EditCardHandler = (columnId: number, cardId: number, newCardTitle: string, newCardTag: string, newCardBgColor: string, colorOptions: ColorOption[]) => void

export type DeleteCardHandler = (columnId: number, cardId: number) => void

export type OnEditCancel = (e: React.FormEvent) => void

// Stores enough information to restore a deleted card or column
export type UndoItem =
  | { type: 'card'; card: Card; columnId: number; index: number }
  | { type: 'column'; column: Column; index: number }
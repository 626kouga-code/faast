import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { createId } from '../utils/id'
import type { AppState, Board, Card, Label } from '../types'

const LABEL_COLORS = ['#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0', '#0079bf']

function createSampleBoard(): Board {
  const labelIds = LABEL_COLORS.slice(0, 3).map(() => createId())
  const labels: Record<string, Label> = {
    [labelIds[0]]: { id: labelIds[0], name: '重要', color: LABEL_COLORS[0] },
    [labelIds[1]]: { id: labelIds[1], name: 'バグ', color: LABEL_COLORS[3] },
    [labelIds[2]]: { id: labelIds[2], name: '要確認', color: LABEL_COLORS[2] },
  }

  const listTodo = createId()
  const listDoing = createId()
  const listDone = createId()

  const card1 = createId()
  const card2 = createId()

  const cards: Record<string, Card> = {
    [card1]: { id: card1, title: 'サンプルカード1', labelIds: [labelIds[0]] },
    [card2]: { id: card2, title: 'サンプルカード2', labelIds: [] },
  }

  return {
    id: createId(),
    title: 'マイボード',
    lists: {
      [listTodo]: { id: listTodo, title: 'Todo', cardIds: [card1, card2] },
      [listDoing]: { id: listDoing, title: 'Doing', cardIds: [] },
      [listDone]: { id: listDone, title: 'Done', cardIds: [] },
    },
    listOrder: [listTodo, listDoing, listDone],
    cards,
    labels,
  }
}

function createEmptyState(): AppState {
  const board = createSampleBoard()
  return {
    boards: { [board.id]: board },
    boardOrder: [board.id],
    activeBoardId: board.id,
  }
}

type Action =
  | { type: 'ADD_BOARD'; title: string }
  | { type: 'DELETE_BOARD'; boardId: string }
  | { type: 'SET_ACTIVE_BOARD'; boardId: string }
  | { type: 'RENAME_BOARD'; boardId: string; title: string }
  | { type: 'ADD_LIST'; boardId: string; title: string }
  | { type: 'RENAME_LIST'; boardId: string; listId: string; title: string }
  | { type: 'DELETE_LIST'; boardId: string; listId: string }
  | { type: 'MOVE_LIST'; boardId: string; listId: string; toIndex: number }
  | { type: 'ADD_CARD'; boardId: string; listId: string; title: string }
  | {
      type: 'UPDATE_CARD'
      boardId: string
      cardId: string
      changes: Partial<Pick<Card, 'title' | 'description' | 'labelIds' | 'dueDate'>>
    }
  | { type: 'DELETE_CARD'; boardId: string; cardId: string }
  | {
      type: 'MOVE_CARD'
      boardId: string
      cardId: string
      fromListId: string
      toListId: string
      toIndex: number
    }
  | { type: 'ADD_LABEL'; boardId: string; name: string; color: string }
  | { type: 'DELETE_LABEL'; boardId: string; labelId: string }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_BOARD': {
      const id = createId()
      const board: Board = {
        id,
        title: action.title,
        lists: {},
        listOrder: [],
        cards: {},
        labels: {},
      }
      return {
        boards: { ...state.boards, [id]: board },
        boardOrder: [...state.boardOrder, id],
        activeBoardId: id,
      }
    }
    case 'DELETE_BOARD': {
      const { [action.boardId]: _removed, ...boards } = state.boards
      const boardOrder = state.boardOrder.filter((id) => id !== action.boardId)
      const activeBoardId =
        state.activeBoardId === action.boardId ? (boardOrder[0] ?? null) : state.activeBoardId
      return { boards, boardOrder, activeBoardId }
    }
    case 'SET_ACTIVE_BOARD':
      return { ...state, activeBoardId: action.boardId }
    case 'RENAME_BOARD': {
      const board = state.boards[action.boardId]
      if (!board) return state
      return {
        ...state,
        boards: { ...state.boards, [board.id]: { ...board, title: action.title } },
      }
    }
    case 'ADD_LIST': {
      const board = state.boards[action.boardId]
      if (!board) return state
      const listId = createId()
      const newBoard: Board = {
        ...board,
        lists: { ...board.lists, [listId]: { id: listId, title: action.title, cardIds: [] } },
        listOrder: [...board.listOrder, listId],
      }
      return { ...state, boards: { ...state.boards, [board.id]: newBoard } }
    }
    case 'RENAME_LIST': {
      const board = state.boards[action.boardId]
      const list = board?.lists[action.listId]
      if (!board || !list) return state
      const newBoard: Board = {
        ...board,
        lists: { ...board.lists, [list.id]: { ...list, title: action.title } },
      }
      return { ...state, boards: { ...state.boards, [board.id]: newBoard } }
    }
    case 'DELETE_LIST': {
      const board = state.boards[action.boardId]
      const list = board?.lists[action.listId]
      if (!board || !list) return state
      const { [action.listId]: _removedList, ...lists } = board.lists
      const cards = { ...board.cards }
      for (const cardId of list.cardIds) delete cards[cardId]
      const newBoard: Board = {
        ...board,
        lists,
        listOrder: board.listOrder.filter((id) => id !== action.listId),
        cards,
      }
      return { ...state, boards: { ...state.boards, [board.id]: newBoard } }
    }
    case 'MOVE_LIST': {
      const board = state.boards[action.boardId]
      if (!board) return state
      const order = board.listOrder.filter((id) => id !== action.listId)
      order.splice(action.toIndex, 0, action.listId)
      const newBoard: Board = { ...board, listOrder: order }
      return { ...state, boards: { ...state.boards, [board.id]: newBoard } }
    }
    case 'ADD_CARD': {
      const board = state.boards[action.boardId]
      const list = board?.lists[action.listId]
      if (!board || !list) return state
      const cardId = createId()
      const card: Card = { id: cardId, title: action.title, labelIds: [] }
      const newBoard: Board = {
        ...board,
        cards: { ...board.cards, [cardId]: card },
        lists: {
          ...board.lists,
          [list.id]: { ...list, cardIds: [...list.cardIds, cardId] },
        },
      }
      return { ...state, boards: { ...state.boards, [board.id]: newBoard } }
    }
    case 'UPDATE_CARD': {
      const board = state.boards[action.boardId]
      const card = board?.cards[action.cardId]
      if (!board || !card) return state
      const newBoard: Board = {
        ...board,
        cards: { ...board.cards, [card.id]: { ...card, ...action.changes } },
      }
      return { ...state, boards: { ...state.boards, [board.id]: newBoard } }
    }
    case 'DELETE_CARD': {
      const board = state.boards[action.boardId]
      const card = board?.cards[action.cardId]
      if (!board || !card) return state
      const { [action.cardId]: _removedCard, ...cards } = board.cards
      const lists = { ...board.lists }
      for (const listId of Object.keys(lists)) {
        if (lists[listId].cardIds.includes(action.cardId)) {
          lists[listId] = {
            ...lists[listId],
            cardIds: lists[listId].cardIds.filter((id) => id !== action.cardId),
          }
        }
      }
      const newBoard: Board = { ...board, cards, lists }
      return { ...state, boards: { ...state.boards, [board.id]: newBoard } }
    }
    case 'MOVE_CARD': {
      const board = state.boards[action.boardId]
      if (!board) return state
      const fromList = board.lists[action.fromListId]
      const toList = board.lists[action.toListId]
      if (!fromList || !toList) return state

      const fromCardIds = fromList.cardIds.filter((id) => id !== action.cardId)
      const toCardIds =
        action.fromListId === action.toListId ? fromCardIds : [...toList.cardIds]
      toCardIds.splice(action.toIndex, 0, action.cardId)

      const lists = { ...board.lists }
      lists[action.fromListId] = { ...fromList, cardIds: fromCardIds }
      lists[action.toListId] = { ...toList, cardIds: toCardIds }

      const newBoard: Board = { ...board, lists }
      return { ...state, boards: { ...state.boards, [board.id]: newBoard } }
    }
    case 'ADD_LABEL': {
      const board = state.boards[action.boardId]
      if (!board) return state
      const labelId = createId()
      const newBoard: Board = {
        ...board,
        labels: {
          ...board.labels,
          [labelId]: { id: labelId, name: action.name, color: action.color },
        },
      }
      return { ...state, boards: { ...state.boards, [board.id]: newBoard } }
    }
    case 'DELETE_LABEL': {
      const board = state.boards[action.boardId]
      if (!board) return state
      const { [action.labelId]: _removedLabel, ...labels } = board.labels
      const cards = { ...board.cards }
      for (const cardId of Object.keys(cards)) {
        if (cards[cardId].labelIds.includes(action.labelId)) {
          cards[cardId] = {
            ...cards[cardId],
            labelIds: cards[cardId].labelIds.filter((id) => id !== action.labelId),
          }
        }
      }
      const newBoard: Board = { ...board, labels, cards }
      return { ...state, boards: { ...state.boards, [board.id]: newBoard } }
    }
    default:
      return state
  }
}

interface BoardContextValue {
  state: AppState
  dispatch: (action: Action) => void
}

const BoardContext = createContext<BoardContextValue | null>(null)

export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useLocalStorage<AppState>('trello-app-state', createEmptyState)

  const dispatch = (action: Action) => {
    setState((prev) => reducer(prev, action))
  }

  const value = useMemo(() => ({ state, dispatch }), [state])

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}

export function useBoardContext() {
  const ctx = useContext(BoardContext)
  if (!ctx) throw new Error('useBoardContext must be used within BoardProvider')
  return ctx
}

export { LABEL_COLORS }
export type { Action }

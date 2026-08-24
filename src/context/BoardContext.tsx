import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { createId } from '../utils/id'
import type { AppState, Board, Label, List } from '../types'

const LABEL_COLORS = ['#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0', '#0079bf']

const INITIAL_NEXT_BACKEND_ID = 1000

function createSampleBoard(nextBackendId: number): { board: Board; nextBackendId: number } {
  let id = nextBackendId

  const labelIds = LABEL_COLORS.slice(0, 3).map(() => createId())
  const labels: Record<string, Label> = {
    [labelIds[0]]: { id: labelIds[0], name: '重要', color: LABEL_COLORS[0] },
    [labelIds[1]]: { id: labelIds[1], name: 'バグ', color: LABEL_COLORS[3] },
    [labelIds[2]]: { id: labelIds[2], name: '要確認', color: LABEL_COLORS[2] },
  }

  const boardBackendId = id++
  const listTodo = createId()
  const listDoing = createId()
  const listDone = createId()
  const listTodoBackendId = id++
  const listDoingBackendId = id++
  const listDoneBackendId = id++

  const board: Board = {
    id: createId(),
    backendId: boardBackendId,
    title: 'マイボード',
    lists: {
      [listTodo]: { id: listTodo, backendId: listTodoBackendId, title: 'Todo' },
      [listDoing]: { id: listDoing, backendId: listDoingBackendId, title: 'Doing' },
      [listDone]: { id: listDone, backendId: listDoneBackendId, title: 'Done' },
    },
    listOrder: [listTodo, listDoing, listDone],
    labels,
    cardLabelIds: {},
  }

  return { board, nextBackendId: id }
}

function createEmptyState(): AppState {
  const { board, nextBackendId } = createSampleBoard(INITIAL_NEXT_BACKEND_ID)
  return {
    boards: { [board.id]: board },
    boardOrder: [board.id],
    activeBoardId: board.id,
    nextBackendId,
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
  | { type: 'SET_CARD_LABELS'; boardId: string; cardId: number; labelIds: string[] }
  | { type: 'ADD_LABEL'; boardId: string; name: string; color: string }
  | { type: 'DELETE_LABEL'; boardId: string; labelId: string }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_BOARD': {
      const id = createId()
      const backendId = state.nextBackendId
      const board: Board = {
        id,
        backendId,
        title: action.title,
        lists: {},
        listOrder: [],
        labels: {},
        cardLabelIds: {},
      }
      return {
        boards: { ...state.boards, [id]: board },
        boardOrder: [...state.boardOrder, id],
        activeBoardId: id,
        nextBackendId: backendId + 1,
      }
    }
    case 'DELETE_BOARD': {
      const { [action.boardId]: _removed, ...boards } = state.boards
      const boardOrder = state.boardOrder.filter((id) => id !== action.boardId)
      const activeBoardId =
        state.activeBoardId === action.boardId ? (boardOrder[0] ?? null) : state.activeBoardId
      return { ...state, boards, boardOrder, activeBoardId }
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
      const backendId = state.nextBackendId
      const newBoard: Board = {
        ...board,
        lists: { ...board.lists, [listId]: { id: listId, backendId, title: action.title } },
        listOrder: [...board.listOrder, listId],
      }
      return {
        ...state,
        boards: { ...state.boards, [board.id]: newBoard },
        nextBackendId: backendId + 1,
      }
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
      const newBoard: Board = {
        ...board,
        lists,
        listOrder: board.listOrder.filter((id) => id !== action.listId),
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
    case 'SET_CARD_LABELS': {
      const board = state.boards[action.boardId]
      if (!board) return state
      const newBoard: Board = {
        ...board,
        cardLabelIds: { ...board.cardLabelIds, [action.cardId]: action.labelIds },
      }
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
      const cardLabelIds: Record<number, string[]> = {}
      for (const [cardId, labelIds] of Object.entries(board.cardLabelIds)) {
        cardLabelIds[Number(cardId)] = labelIds.filter((id) => id !== action.labelId)
      }
      const newBoard: Board = { ...board, labels, cardLabelIds }
      return { ...state, boards: { ...state.boards, [board.id]: newBoard } }
    }
    default:
      return state
  }
}

// 旧バージョン(backendId/cardLabelIds導入前)のlocalStorageデータを補完する
function migrate(state: AppState): AppState {
  let nextBackendId = state.nextBackendId ?? INITIAL_NEXT_BACKEND_ID
  let changed = state.nextBackendId === undefined

  const boards: Record<string, Board> = {}
  for (const board of Object.values(state.boards)) {
    let backendId = board.backendId
    if (backendId === undefined) {
      backendId = nextBackendId++
      changed = true
    }
    const lists: Record<string, List> = {}
    for (const list of Object.values(board.lists)) {
      let listBackendId = list.backendId
      if (listBackendId === undefined) {
        listBackendId = nextBackendId++
        changed = true
      }
      lists[list.id] = { id: list.id, backendId: listBackendId, title: list.title }
    }
    boards[board.id] = {
      ...board,
      backendId,
      lists,
      cardLabelIds: board.cardLabelIds ?? {},
    }
  }

  if (!changed) return state
  return { ...state, boards, nextBackendId }
}

interface BoardContextValue {
  state: AppState
  dispatch: (action: Action) => void
}

const BoardContext = createContext<BoardContextValue | null>(null)

export function BoardProvider({ children }: { children: ReactNode }) {
  const [rawState, setState] = useLocalStorage<AppState>('trello-app-state', createEmptyState)
  const state = useMemo(() => migrate(rawState), [rawState])

  const dispatch = (action: Action) => {
    setState((prev) => reducer(migrate(prev), action))
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

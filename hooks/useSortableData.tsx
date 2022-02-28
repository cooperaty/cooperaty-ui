import { useMemo, useState } from 'react'

export function useSortableData<T>(
  items: T[],
  config = null
): { items: T[]; requestSort: any; sortConfig: any } {
  const [sortConfig, setSortConfig] = useState(config)

  const sortedItems = useMemo(() => {
    const sortableItems = items ? [...items] : []
    if (sortConfig !== null) {
      const keys = sortConfig.key.split('.')
      sortableItems.sort((a, b) => {
        const aElement =
          keys.length > 1
            ? keys.length > 2
              ? a[keys[0]][keys[1]]
              : a[keys[0]][keys[1]][keys[2]]
            : a[sortConfig.key]
        const bElement =
          keys.length > 1
            ? keys.length > 2
              ? b[keys[0]][keys[1]]
              : b[keys[0]][keys[1]][keys[2]]
            : b[sortConfig.key]
        if (!isNaN(aElement)) {
          return sortConfig.direction === 'ascending'
            ? aElement - bElement
            : bElement - aElement
        }
        if (aElement < bElement) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (aElement > bElement) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [items, sortConfig])

  const requestSort = (key) => {
    let direction = 'ascending'
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  return { items: sortedItems, requestSort, sortConfig }
}

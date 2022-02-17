import useStore from '../stores/useStore'

export type Notification = {
  type: 'success' | 'info' | 'error' | 'confirm'
  title: string
  description?: null | string
  txid?: string
  show: boolean
  id: number
}

export function notify(newNotification: {
  type?: 'success' | 'info' | 'error' | 'confirm'
  title: string
  description?: string
  txid?: string
}) {
  const setStore = useStore.getState().set
  const notifications = useStore.getState().notifications
  const lastId = useStore.getState().notificationIdCounter
  const newId = lastId + 1

  const newNotif: Notification = {
    id: newId,
    type: 'success',
    show: true,
    description: null,
    ...newNotification,
  }

  setStore((state) => {
    state.notificationIdCounter = newId
    state.notifications = [...notifications, newNotif]
  })
}

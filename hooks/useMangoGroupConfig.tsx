import { useMemo } from 'react'
import useStore from '../stores/useStore'
import { Config } from '@blockworks-foundation/mango-client'
import { GroupConfig } from '@blockworks-foundation/mango-client/lib/src/config'

export default function useMangoGroupConfig(): GroupConfig {
  const mangoGroupName = useStore((state) => state.selectedMangoGroup.name)
  const cluster = useStore((s) => s.connection.cluster)

  const mangoGroupConfig = useMemo(
    () => Config.ids().getGroup(cluster, mangoGroupName),
    [cluster, mangoGroupName]
  )

  return mangoGroupConfig
}

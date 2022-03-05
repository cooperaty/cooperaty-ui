import { ArrowSmDownIcon } from '@heroicons/react/solid'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SideBadge from '../market/SideBadge'
import { LinkButton } from '../elements/Button'
import { useSortableData } from '../../hooks/useSortableData'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../TradePageGrid'
import { Table, Td, Th, TrBody, TrHead } from '../elements/TableElements'
import { ExpandableRow } from '../elements/TableElements'
import { useTranslation } from 'next-i18next'
import Pagination from '../elements/Pagination'
import usePagination from '../../hooks/usePagination'
import useStore, { Exercise } from '../../stores/useStore'
import { useEffect } from 'react'
import useLocalStorageState from '../../hooks/useLocalStorageState'

export const EXERCISES_HISTORY_STORAGE_KEY = 'exercisesHistory'

const PracticeHistoryTable = ({ numExercises }: { numExercises?: number }) => {
  const { t } = useTranslation('common')
  const setStore = useStore((s) => s.set)
  const { asPath } = useRouter()
  const traderAccount = useStore((s) => s.selectedTraderAccount.current)
  const [savedExercisesHistory, setSavedExercisesHistory] =
    useLocalStorageState(
      EXERCISES_HISTORY_STORAGE_KEY + (traderAccount?.publicKey ?? ''),
      []
    )
  const exercisesHistory = useStore((state) => state.exercisesHistory)
  const actions = useStore((state) => state.actions)
  const preFilteredExercises = exercisesHistory.filter(
    (exercise) => exercise.state === 'checking'
  )
  console.log(preFilteredExercises)

  useEffect(() => {
    if (savedExercisesHistory.length > 0) {
      setStore((state) => {
        state.exercisesHistory = savedExercisesHistory
      })
    }
  }, [])

  const { items, requestSort, sortConfig } =
    useSortableData(preFilteredExercises)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false
  const filteredExercises = preFilteredExercises
    ? items.slice(0, numExercises)
    : items

  const {
    paginatedData,
    totalPages,
    nextPage,
    previousPage,
    page,
    firstPage,
    lastPage,
    setData,
  } = usePagination(filteredExercises, { perPage: 500 })

  useEffect(() => {
    setData(filteredExercises)
    setSavedExercisesHistory(exercisesHistory)
  }, [exercisesHistory])

  return (
    <div className={`flex flex-col sm:pb-4`}>
      <div className={`overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {preFilteredExercises && preFilteredExercises.length ? (
            !isMobile ? (
              <>
                <Table>
                  <thead>
                    <TrHead>
                      <Th>
                        <LinkButton
                          className="flex items-center no-underline font-normal"
                          onClick={() => requestSort('type')}
                        >
                          {t('type')}
                          <ArrowSmDownIcon
                            className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                              sortConfig?.key === 'type'
                                ? sortConfig.direction === 'ascending'
                                  ? 'transform rotate-180'
                                  : 'transform rotate-360'
                                : null
                            }`}
                          />
                        </LinkButton>
                      </Th>
                      <Th>
                        <LinkButton
                          className="flex items-center no-underline font-normal"
                          onClick={() =>
                            requestSort('chart.direction.position')
                          }
                        >
                          {t('side')}
                          <ArrowSmDownIcon
                            className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                              sortConfig?.key === 'chart.direction.position'
                                ? sortConfig.direction === 'ascending'
                                  ? 'transform rotate-180'
                                  : 'transform rotate-360'
                                : null
                            }`}
                          />
                        </LinkButton>
                      </Th>
                      <Th>
                        <LinkButton
                          className="flex items-center no-underline font-normal"
                          onClick={() =>
                            requestSort('chart.position.takeProfit')
                          }
                        >
                          {t('take-profit')}
                          <ArrowSmDownIcon
                            className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                              sortConfig?.key === 'chart.position.takeProfit'
                                ? sortConfig.direction === 'ascending'
                                  ? 'transform rotate-180'
                                  : 'transform rotate-360'
                                : null
                            }`}
                          />
                        </LinkButton>
                      </Th>
                      <Th>
                        <LinkButton
                          className="flex items-center no-underline font-normal"
                          onClick={() => requestSort('chart.position.stopLoss')}
                        >
                          {t('stop-loss')}
                          <ArrowSmDownIcon
                            className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                              sortConfig?.key === 'chart.position.stopLoss'
                                ? sortConfig.direction === 'ascending'
                                  ? 'transform rotate-180'
                                  : 'transform rotate-360'
                                : null
                            }`}
                          />
                        </LinkButton>
                      </Th>
                      <Th>
                        <LinkButton
                          className="flex items-center no-underline font-normal"
                          onClick={() => requestSort('state')}
                        >
                          {t('state')}
                          <ArrowSmDownIcon
                            className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                              sortConfig?.key === 'state'
                                ? sortConfig.direction === 'ascending'
                                  ? 'transform rotate-180'
                                  : 'transform rotate-360'
                                : null
                            }`}
                          />
                        </LinkButton>
                      </Th>
                    </TrHead>
                  </thead>
                  <tbody>
                    {paginatedData.map((exercise: Exercise, index) => {
                      return (
                        <TrBody
                          index={index}
                          key={`${exercise.data.publicKey}`}
                        >
                          <Td>
                            <LinkButton
                              className="flex items-center no-underline font-normal"
                              onClick={() =>
                                actions.setNewExercise({ ...exercise })
                              }
                            >
                              <div className="flex items-center">
                                <img
                                  alt=""
                                  width="20"
                                  height="20"
                                  src={`/assets/icons/modalities/${exercise.type.toLowerCase()}.png`}
                                  className={`mr-2.5`}
                                />
                                <span>{exercise.type}</span>
                              </div>
                            </LinkButton>
                          </Td>
                          <Td>
                            <SideBadge
                              side={exercise.chart.position.direction}
                            />
                          </Td>
                          <Td>{exercise.chart.position.takeProfit}</Td>
                          <Td>{exercise.chart.position.stopLoss}</Td>
                          <Td>{t(exercise.state)}</Td>
                        </TrBody>
                      )
                    })}
                  </tbody>
                </Table>
                {numExercises && items.length > numExercises ? (
                  <div className="flex items-center justify-center mt-4">
                    <Link href="/account" shallow={true}>
                      {t('view-all-exercises')}
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center justify-end">
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      nextPage={nextPage}
                      lastPage={lastPage}
                      firstPage={firstPage}
                      previousPage={previousPage}
                    />
                  </div>
                )}
              </>
            ) : (
              paginatedData.map((exercise: Exercise, index) => (
                <ExpandableRow
                  buttonTemplate={
                    <>
                      <div className="flex items-center justify-between text-fgd-1 w-full">
                        <div className="text-left">{exercise.state}</div>
                        <div>
                          <div className="text-right">
                            <div className="flex items-center mb-0.5 text-left">
                              <img
                                alt=""
                                width="16"
                                height="16"
                                src={`/assets/icons/modalities/${exercise.type.toLowerCase()}.png`}
                                className={`mr-1.5`}
                              />
                              {exercise.type}
                            </div>
                            <div className="text-th-fgd-3 text-xs">
                              <span
                                className={`mr-1
                                ${
                                  exercise.chart.position.direction ==
                                  'long_position'
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }
                              `}
                              >
                                {exercise.chart.position.direction
                                  .split('_')[0]
                                  .toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  }
                  key={`${index}`}
                  index={index}
                  panelTemplate={
                    <div className="grid grid-cols-2 grid-flow-row gap-4">
                      <div className="text-left">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          {t('take-profit')}
                        </div>
                        {exercise.chart.position.takeProfit}
                      </div>
                      <div className="text-left">
                        <div className="pb-0.5 text-th-fgd-3 text-xs">
                          {t('stop-loss')}
                        </div>
                        {exercise.chart.position.stopLoss}
                      </div>
                    </div>
                  }
                />
              ))
            )
          ) : (
            <div className="w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md">
              {t('no-practice-history')}
              {asPath === '/account' ? (
                <Link href={'/'} shallow={true}>
                  <a className="inline-flex ml-2 py-0">{t('practice')}</a>
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PracticeHistoryTable

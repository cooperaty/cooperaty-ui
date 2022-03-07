import { useState, useEffect } from 'react'
import { notify } from '../../utils/notifications'
import useStore from '../../stores/useStore'
import Button from '../elements/Button'
import Input from '../elements/Input'
import { ElementTitle } from '../elements/styles'
import ButtonGroup from '../elements/ButtonGroup'
import { useTranslation } from 'next-i18next'
import { exerciseToHistoryItem } from '../../stores/constants'

const PREDICTION_PERCENT_LIST_LOSS = [
  '0%',
  '-20%',
  '-40%',
  '-60%',
  '-80%',
  '-100%',
]
const PREDICTION_PERCENT_LIST_PROFIT = [
  '0%',
  '20%',
  '40%',
  '60%',
  '80%',
  '100%',
]

const MINIMUM_PREDICTION_FEE = 0.0001

export default function SimplePracticeForm() {
  const set = useStore((s) => s.set)
  const walletTokens = useStore((s) => s.wallet.tokens)
  const cooperatyClient = useStore((s) => s.connection.cooperatyClient)
  const traderAccount = useStore((s) => s.selectedTraderAccount.current)
  const selectedExercise = useStore((s) => s.selectedExercise.current)
  const validation = useStore((s) => s.practiceForm.validation)
  const loadNewExercise = useStore((s) => s.selectedExercise.loadNew)

  const { t } = useTranslation('common')
  const [, setSubmitting] = useState(false)
  const [validationPercentage, setValidationPercentage] = useState('0%')
  const [, setinsufficientSol] = useState(false)
  const setValidation = (validation) =>
    set((s) => {
      if (!Number.isNaN(parseFloat(validation))) {
        s.practiceForm.validation = parseFloat(validation)
      } else {
        s.practiceForm.validation = validation
      }
    })

  const disabledChangeExerciseButton = traderAccount === null || loadNewExercise
  const disabledValidationButton =
    traderAccount === null ||
    selectedExercise === null ||
    selectedExercise.state != 'active'

  const onSetValidation = (validation: number | '') => {
    setValidation(validation)
  }

  const onValidationTypeChange = () => {
    if (typeof validation === 'number') {
      setValidation(-1 * validation)
    }
  }

  const onValidationPercentChange = (validationPercentage: string) => {
    setValidationPercentage(validationPercentage)
    setValidation(parseInt(validationPercentage.replace('%', '')))
  }

  function onSubmitChangeExercise() {
    set((s) => {
      if (selectedExercise) {
        if (selectedExercise.state == 'active')
          s.exercisesHistory.push(
            exerciseToHistoryItem(selectedExercise, 'skipped')
          )
        s.selectedExercise.current = null
      }
      s.selectedExercise.loadNew = true
    })
  }

  async function onSubmitValidation() {
    if (!validation) {
      notify({
        title: t('missing-validation'),
        type: 'error',
      })
      return
    }

    const wallet = useStore.getState().wallet.current
    const selectedExercise = useStore.getState().selectedExercise.current
    const traderAccount = useStore.getState().selectedTraderAccount.current

    if (
      !wallet ||
      !traderAccount ||
      !selectedExercise ||
      !selectedExercise?.data
    )
      return

    setSubmitting(true)

    try {
      const txid = await cooperatyClient.addValidation(
        traderAccount,
        selectedExercise.data,
        validation
      )

      notify({ title: t('validation-successfully-placed'), txid })

      set((s) => {
        if (selectedExercise.state == 'active')
          s.exercisesHistory.push(
            exerciseToHistoryItem(selectedExercise, 'checking', validation)
          )
        s.practiceForm.validation = 0
        s.selectedExercise.loadNew = true
      })
    } catch (e) {
      notify({
        title: t('error'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Check if the user has enough SOL to make the validation
  useEffect(() => {
    const walletSol = walletTokens.find((a) => a.config.symbol === 'SOL')
    walletSol
      ? setinsufficientSol(walletSol.uiBalance < MINIMUM_PREDICTION_FEE)
      : null
  }, [walletTokens])

  // Update the validation percentage list choices based on the sign of the current validation
  useEffect(() => {
    const validationPercentage = `${validation}%`
    const validationPercentageList =
      validation >= 0
        ? PREDICTION_PERCENT_LIST_PROFIT
        : PREDICTION_PERCENT_LIST_LOSS
    if (validationPercentageList.includes(validationPercentage)) {
      setValidationPercentage(`${validation}%`)
    } else {
      setValidationPercentage(null)
    }
  }, [validation])

  return (
    <div className="flex flex-col h-full">
      <ElementTitle>{selectedExercise?.type || 'Practice'}</ElementTitle>
      <div className="grid grid-cols-12 gap-2 text-left">
        <div className="col-span-6">
          <label className="text-xxs text-th-fgd-3">{t('type')}</label>
          <ButtonGroup
            activeValue={validation >= 0 ? 'Profit' : 'Loss'}
            className="h-10"
            onChange={() => onValidationTypeChange()}
            values={['Loss', 'Profit']}
          />
        </div>
        <div className="col-span-6">
          <label className="text-xxs text-th-fgd-3">{t('validation')}</label>
          <Input
            type="number"
            min="0"
            max="100"
            onChange={(e) => onSetValidation(e.target.value)}
            value={validation}
            placeholder="0"
            suffix="%"
          />
        </div>
        <div className="col-span-12 mt-1">
          <ButtonGroup
            activeValue={validationPercentage}
            onChange={(p) => onValidationPercentChange(p)}
            values={
              validation >= 0
                ? PREDICTION_PERCENT_LIST_PROFIT
                : PREDICTION_PERCENT_LIST_LOSS
            }
          />
        </div>
        <div className={`col-span-12 pt-2`}>
          <div className={`grid grid-cols-2 grid-rows-1 gap-4 pt-2 sm:pt-4`}>
            <Button
              disabled={disabledChangeExerciseButton}
              onClick={onSubmitChangeExercise}
              className={`${
                !disabledChangeExerciseButton
                  ? 'bg-th-bkg-2 border border-th-white hover:border-th-white'
                  : 'border border-th-bkg-4'
              } text-th-white hover:text-th-fgd-1 hover:bg-th-white w-full'`}
            >
              <span>
                {selectedExercise ? t('change-exercise') : t('load-exercise')}
              </span>
            </Button>
            <Button
              disabled={disabledValidationButton}
              onClick={onSubmitValidation}
              className={`${
                !disabledValidationButton
                  ? 'bg-th-bkg-2 border border-th-green hover:border-th-green-dark'
                  : 'border border-th-bkg-4'
              } text-th-green hover:text-th-fgd-1 hover:bg-th-green-dark w-full`}
            >
              <span>{t('send-validation')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

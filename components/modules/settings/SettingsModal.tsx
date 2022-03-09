import React, { useEffect, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/solid'
import Modal from '../../elements/Modal'
import { ElementTitle } from '../../elements/styles'
import Button from '../../elements/Button'
import Input from '../../elements/Input'
import useStore from '../../../stores/useStore'
import useLocalStorageState from '../../../hooks/useLocalStorageState'
import Select from '../../elements/Select'
import { useTranslation } from 'next-i18next'
import Switch from '../../elements/Switch'
import { ExerciseData } from '../../../sdk'

const NODE_URLS = [
  { label: 'Devnet', value: 'https://api.google.devnet.solana.com' },
  { label: 'Custom', value: '' },
]

const CUSTOM_NODE = NODE_URLS.find((n) => n.label === 'Custom')

export const NODE_URL_KEY = 'node-url-key-0.5'
export const DEFAULT_MARKET_KEY = 'defaultMarket'
export const ORDERBOOK_FLASH_KEY = 'showOrderbookFlash'
export const initialMarket = {
  base: 'BTC',
  kind: 'perp',
  name: 'BTC-PERP',
  path: '/market?name=BTC-PERP',
}

const SettingsModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation('common')
  const currentExercise = useStore((s) => s.selectedExercise.current)
  const [settingsView, setSettingsView] = useState('')
  const [rpcEndpointUrl] = useLocalStorageState(
    NODE_URL_KEY,
    NODE_URLS[0].value
  )
  const [showOrderbookFlash, setShowOrderbookFlash] = useLocalStorageState(
    ORDERBOOK_FLASH_KEY,
    true
  )
  const rpcEndpoint =
    NODE_URLS.find((node) => node.value === rpcEndpointUrl) || CUSTOM_NODE
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {settingsView !== '' ? (
        <button
          className="absolute default-transition flex items-center left-2 text-th-fgd-3 text-xs top-3 focus:outline-none hover:text-th-fgd-1"
          onClick={() => setSettingsView('')}
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span>{t('back')}</span>
        </button>
      ) : null}
      <Modal.Header>
        <ElementTitle noMarignBottom>{t('settings')}</ElementTitle>
      </Modal.Header>
      {!settingsView ? (
        <div className="border-b border-th-bkg-4">
          <button
            className="border-t border-th-bkg-4 default-transition flex font-normal items-center justify-between py-3 text-th-fgd-1 w-full hover:text-th-primary focus:outline-none"
            onClick={() => setSettingsView('RPC Endpoint')}
          >
            <span>{t('rpc-endpoint')}</span>
            <div className="flex items-center text-th-fgd-3 text-xs">
              {rpcEndpoint.label}
              <ChevronRightIcon className="h-5 ml-1 w-5 text-th-primary" />
            </div>
          </button>
          <button
            className="border-t border-th-bkg-4 default-transition flex font-normal items-center justify-between py-3 text-th-fgd-1 w-full hover:text-th-primary focus:outline-none"
            onClick={() => setSettingsView('Exercise')}
          >
            <span>{t('exercise')}</span>
            <div className="flex items-center text-th-fgd-3 text-xs">
              {currentExercise?.data.account.cid.slice(0, 30)}...
              <ChevronRightIcon className="h-5 ml-1 w-5 text-th-primary" />
            </div>
          </button>
          <div className="border-t border-th-bkg-4 flex items-center justify-between py-3 text-th-fgd-1">
            <span>{t('orderbook-animation')}</span>
            <Switch
              checked={showOrderbookFlash}
              onChange={(checked) => setShowOrderbookFlash(checked)}
            />
          </div>
        </div>
      ) : null}
      <SettingsContent
        settingsView={settingsView}
        setSettingsView={setSettingsView}
      />
      {!settingsView ? (
        <div className="flex justify-center pt-6">
          <Button onClick={onClose}>{t('done')}</Button>
        </div>
      ) : null}
    </Modal>
  )
}

export default React.memo(SettingsModal)

const SettingsContent = ({ settingsView, setSettingsView }) => {
  switch (settingsView) {
    case 'RPC Endpoint':
      return <RpcEndpointSettings setSettingsView={setSettingsView} />
    case 'Exercise':
      return <ExerciseSettings setSettingsView={setSettingsView} />
    case 'New Exercise':
      return <NewExerciseSettings setSettingsView={setSettingsView} />
    case '':
      return null
  }
}

const RpcEndpointSettings = ({ setSettingsView }) => {
  const { t } = useTranslation('common')
  const actions = useStore((s) => s.actions)
  const [rpcEndpointUrl, setRpcEndpointUrl] = useLocalStorageState(
    NODE_URL_KEY,
    NODE_URLS[0].value
  )
  const rpcEndpoint =
    NODE_URLS.find((node) => node.value === rpcEndpointUrl) || CUSTOM_NODE

  const handleSetEndpointUrl = (endpointUrl) => {
    setRpcEndpointUrl(endpointUrl)
    actions.updateConnection(endpointUrl)
    setSettingsView('')
  }
  const handleSelectEndpointUrl = (url) => {
    setRpcEndpointUrl(url)
  }
  return (
    <div className="flex flex-col text-th-fgd-1">
      <label className="block font-semibold mb-1 text-xs">
        {t('rpc-endpoint')}
      </label>
      <Select
        value={rpcEndpoint.label}
        onChange={(url) => handleSelectEndpointUrl(url)}
        className="w-full"
      >
        <div className="space-y-2">
          {NODE_URLS.map((node) => (
            <Select.Option
              key={node.value}
              value={node.value}
              className={`bg-th-bkg-1 relative rounded-md w-full px-3 py-3 cursor-pointer default-transition flex hover:bg-th-bkg-3 focus:outline-none`}
            >
              <div className="flex items-center justify-between w-full">
                {node.label}
              </div>
            </Select.Option>
          ))}
        </div>
      </Select>
      {rpcEndpoint.label === 'Custom' ? (
        <div className="pt-4">
          <label className="block font-semibold mb-1 text-xs">
            {t('node-url')}
          </label>
          <Input
            type="text"
            value={rpcEndpointUrl}
            onChange={(e) => setRpcEndpointUrl(e.target.value)}
          />
        </div>
      ) : null}
      <Button
        onClick={() => handleSetEndpointUrl(rpcEndpointUrl)}
        className="mt-4 w-full"
      >
        <div className={`flex items-center justify-center`}>{t('save')}</div>
      </Button>
    </div>
  )
}

const ExerciseSettings = ({ setSettingsView }) => {
  const { t } = useTranslation('common')
  const actions = useStore((s) => s.actions)
  const currentExercise = useStore((s) => s.selectedExercise.current)
  const cooperatyClient = useStore((s) => s.connection.cooperatyClient)
  const [availableExercises, setAvailableExercises] = useState([])
  const [exerciseCID, setExerciseCID] = useState('')
  const [addOutcome, setAddOutcome] = useState(false)
  const [outcome, setOutcome] = useState(100)

  const getExercise = (exerciseCID) => {
    return availableExercises.find(
      (exercise) => exercise.account.cid === exerciseCID
    )
  }

  const handleSetExercise = async (exerciseCID) => {
    const exercise = getExercise(exerciseCID)
    if (exercise != null) {
      await actions.fetchExercise(exercise)
      setSettingsView('')
    }
  }

  const handleSelectExercise = (selectedExerciseCID) => {
    if (selectedExerciseCID != null && selectedExerciseCID.length == 59) {
      setExerciseCID(selectedExerciseCID)
    }
  }

  const handleCloseExercise = async (exerciseCID) => {
    const exercise = getExercise(exerciseCID)
    if (exercise != null) {
      await cooperatyClient.closeExercise(exercise)
      setSettingsView('')
    }
  }

  const handleSetOutcome = async (outcome) => {
    if (outcome > 100) {
      setOutcome(100)
    } else if (outcome < -100) {
      setOutcome(-100)
    } else {
      setOutcome(outcome)
    }
  }

  const handleAddOutcomeExercise = async (exerciseCID) => {
    const exercise = getExercise(exerciseCID)
    if (exercise != null) {
      await cooperatyClient.addOutcome(exercise, outcome)
      setSettingsView('')
    }
  }

  const handleCheckAllValidationsExercise = async (exerciseCID) => {
    const exercise = getExercise(exerciseCID)
    if (exercise != null) {
      await cooperatyClient.checkAllValidations(exercise)
      setSettingsView('')
    }
  }

  const setInitialAvailableExercises = async () => {
    setAvailableExercises(await cooperatyClient.getFilteredExercises())
  }

  useEffect(() => {
    setInitialAvailableExercises()
    if (currentExercise) {
      setExerciseCID(currentExercise.data.account.cid)
    }
  }, [])

  return (
    <div className="flex flex-col text-th-fgd-1">
      <label className="block font-semibold mb-1 text-xs">
        {t('exercise')}
      </label>
      <Select
        value={exerciseCID}
        onChange={(cid) => handleSelectExercise(cid)}
        className="w-full"
      >
        <div className="space-y-2">
          {availableExercises.map((exercise: ExerciseData) => (
            <Select.Option
              key={exercise.account.cid}
              value={exercise.account.cid}
              className={`bg-th-bkg-1 relative rounded-md w-full px-3 py-3 cursor-pointer default-transition flex hover:bg-th-bkg-3 focus:outline-none overflow-hidden`}
            >
              <div className="flex items-center justify-between w-full">
                {exercise?.account.cid.slice(0, 30)}...
              </div>
            </Select.Option>
          ))}
        </div>
      </Select>
      {addOutcome ? (
        <>
          <div className="pt-4">
            <label className="block font-semibold mb-1 text-xs">
              {t('outcome')}
            </label>
            <Input
              type="number"
              error={outcome == null || outcome == 0}
              value={outcome}
              onChange={(e) => handleSetOutcome(e.target.value)}
            />
          </div>
          <Button
            onClick={() => handleAddOutcomeExercise(outcome)}
            className="mt-4 w-full"
          >
            <div className={`flex items-center justify-center`}>{t('add')}</div>
          </Button>
          <Button onClick={() => setAddOutcome(false)} className="mt-4 w-full">
            <div className={`flex items-center justify-center`}>
              {t('cancel')}
            </div>
          </Button>
        </>
      ) : (
        <>
          <Button
            onClick={() => setSettingsView('New Exercise')}
            className="mt-4 w-full"
          >
            <div className={`flex items-center justify-center`}>
              {t('create-exercise')}
            </div>
          </Button>
          <Button onClick={() => setAddOutcome(true)} className="mt-4 w-full">
            <div className={`flex items-center justify-center`}>
              {t('add-outcome')}
            </div>
          </Button>
          <Button
            onClick={() => handleCheckAllValidationsExercise(exerciseCID)}
            className="mt-4 w-full"
          >
            <div className={`flex items-center justify-center`}>
              {t('check-all-validations')}
            </div>
          </Button>
          <Button
            onClick={() => handleCloseExercise(exerciseCID)}
            className="mt-4 w-full"
          >
            <div className={`flex items-center justify-center`}>
              {t('close')}
            </div>
          </Button>
          <Button
            onClick={() => handleSetExercise(exerciseCID)}
            className="mt-4 w-full"
          >
            <div className={`flex items-center justify-center`}>
              {t('save')}
            </div>
          </Button>
        </>
      )}
    </div>
  )
}

const NewExerciseSettings = ({ setSettingsView }) => {
  const { t } = useTranslation('common')
  const cooperatyClient = useStore((s) => s.connection.cooperatyClient)
  const [newExerciseCID, setNewExerciseCID] = useState('')

  const handleCreateExercise = async (exerciseCID) => {
    if (exerciseCID != null && exerciseCID.length == 59) {
      await cooperatyClient.createExercise(exerciseCID)
      setSettingsView('')
    }
  }

  return (
    <div className="flex flex-col text-th-fgd-1">
      <label className="block font-semibold mb-1 text-xs">
        {t('create-exercise')}
      </label>
      <div className="pt-4">
        <label className="block font-semibold mb-1 text-xs">{t('cid')}</label>
        <Input
          type="text"
          error={newExerciseCID == null || newExerciseCID.length !== 59}
          value={newExerciseCID}
          onChange={(e) => setNewExerciseCID(e.target.value)}
        />
      </div>
      <Button
        onClick={() => handleCreateExercise(newExerciseCID)}
        className="mt-4 w-full"
      >
        <div className={`flex items-center justify-center`}>{t('create')}</div>
      </Button>
      <Button
        onClick={() => setSettingsView('Exercise')}
        className="mt-4 w-full"
      >
        <div className={`flex items-center justify-center`}>{t('cancel')}</div>
      </Button>
    </div>
  )
}

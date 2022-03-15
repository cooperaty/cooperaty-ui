import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import {
  widget,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
  IOrderLineAdapter,
} from '../../public/charting_library'
import useStore from '../../stores/useStore'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../practice/PracticePageGrid'
import Datafeed from './datafeed'
import { sleep } from '../../utils'

export const priceToValidation = (price: number, bar): number => {
  let newValidation

  if (price > bar.upperPrice) {
    newValidation = 1
  } else if (price < bar.lowerPrice) {
    newValidation = -1
  } else if (price >= bar.close) {
    newValidation = (price - bar.close) / (bar.upperPrice - bar.close)
  } else {
    newValidation = (price - bar.close) / (bar.close - bar.lowerPrice)
  }

  return (bar.close < bar.takeProfitPrice ? 1 : -1) * newValidation * 100
}

export const validationToPrice = (validation: number, bar): number => {
  validation /= 100

  if (bar.close < bar.takeProfitPrice) {
    if (validation > 0) {
      return validation * (bar.upperPrice - bar.close) + bar.close
    } else {
      return validation * (bar.close - bar.lowerPrice) + bar.close
    }
  } else {
    if (validation > 0) {
      return validation * (bar.lowerPrice - bar.close) + bar.close
    } else {
      return validation * (bar.close - bar.upperPrice) + bar.close
    }
  }
}

export interface ChartContainerProps {
  symbol: ChartingLibraryWidgetOptions['symbol']
  interval: ChartingLibraryWidgetOptions['interval']
  libraryPath: ChartingLibraryWidgetOptions['library_path']
  chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url']
  chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version']
  clientId: ChartingLibraryWidgetOptions['client_id']
  userId: ChartingLibraryWidgetOptions['user_id']
  fullscreen: ChartingLibraryWidgetOptions['fullscreen']
  autosize: ChartingLibraryWidgetOptions['autosize']
  studiesOverrides: ChartingLibraryWidgetOptions['studies_overrides']
  containerId: ChartingLibraryWidgetOptions['container_id']
  theme: string
}

const TVChartContainer = () => {
  const set = useStore((s) => s.set)
  const validation = useStore((s) => s.practiceForm.validation)
  const currentExercise = useStore((s) => s.selectedExercise.current)
  const currentExerciseChart = currentExercise.file
  const currentExerciseSolution = currentExercise.solution

  const { theme } = useTheme()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const setValidation = (validation) =>
    set((s) => {
      if (!Number.isNaN(parseFloat(validation))) {
        s.practiceForm.validation = parseFloat(validation)
      } else {
        s.practiceForm.validation = validation
      }
    })

  // @ts-ignore
  const defaultProps: ChartContainerProps = {
    symbol: currentExercise?.file.type,
    interval: '30' as ResolutionString,
    theme: 'Dark',
    containerId: 'tv_chart_container',
    libraryPath: '/charting_library/',
    fullscreen: false,
    autosize: true,
    studiesOverrides: {
      'volume.volume.color.0': theme === 'Cooperaty' ? '#E54033' : '#CC2929',
      'volume.volume.color.1': theme === 'Cooperaty' ? '#AFD803' : '#5EBF4D',
      'volume.precision': 4,
    },
  }

  const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null)
  const validationLine = useRef<IOrderLineAdapter | null>(null)
  const lastBarData = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!currentExerciseChart) return
    const exerciseBars = currentExerciseChart.candles.map((item) => {
      return Object.assign({}, item)
    })

    console.log('solution', currentExerciseSolution)

    if (currentExerciseSolution?.candles?.length > 0) {
      console.log('Loading solution candles', currentExerciseSolution.candles)
      exerciseBars.concat(
        currentExerciseSolution.candles.map((item) => {
          return Object.assign({}, item)
        })
      )
    }

    console.log('exerciseBars', exerciseBars)

    const datafeed = new Datafeed(exerciseBars, ['1', '5', '15', '30'])

    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: currentExercise.file.type,
      // BEWARE: no trailing slash is expected in feed URL
      // tslint:disable-next-line:no-any
      // @ts-ignore
      datafeed,
      interval:
        defaultProps.interval as ChartingLibraryWidgetOptions['interval'],
      container_id:
        defaultProps.containerId as ChartingLibraryWidgetOptions['container_id'],
      library_path: defaultProps.libraryPath as string,
      locale: 'en',
      disabled_features: [
        'use_localstorage_for_settings',
        'timeframes_toolbar',
        // 'volume_force_overlay',
        //isMobile && 'left_toolbar',
        'show_logo_on_all_charts',
        'caption_buttons_text_if_possible',
        'header_settings',
        'header_chart_type',
        'header_compare',
        'compare_symbol',
        'header_screenshot',
        // 'header_widget_dom_node',
        // 'header_widget',
        'header_saveload',
        'header_undo_redo',
        'header_interval_dialog_button',
        'show_interval_dialog_on_key_press',
        'header_symbol_search',
        'symbol_info',
        'display_market_status',
        'show_chart_property_page',
      ],
      load_last_chart: true,
      client_id: defaultProps.clientId,
      user_id: defaultProps.userId,
      fullscreen: defaultProps.fullscreen,
      autosize: defaultProps.autosize,
      studies_overrides: defaultProps.studiesOverrides,
      theme: theme === 'Light' ? 'Light' : 'Dark',
      custom_css_url: '/tradingview-chart.css',
      loading_screen: { backgroundColor: 'rgba(0,0,0,0.1)' },
      container_border: { background: 'transparent' },
      overrides: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        'paneProperties.background':
          theme === 'Dark'
            ? '#1B1B1F'
            : theme === 'Light'
            ? '#fff'
            : 'rgba(0,0,0,0)',
        'mainSeriesProperties.candleStyle.barColorsOnPrevClose': true,
        'mainSeriesProperties.candleStyle.drawWick': true,
        'mainSeriesProperties.candleStyle.drawBorder': true,
        'mainSeriesProperties.candleStyle.upColor':
          theme === 'Cooperaty' ? '#AFD803' : '#5EBF4D',
        'mainSeriesProperties.candleStyle.downColor':
          theme === 'Cooperaty' ? '#E54033' : '#CC2929',
        'mainSeriesProperties.candleStyle.borderColor':
          theme === 'Cooperaty' ? '#AFD803' : '#5EBF4D',
        'mainSeriesProperties.candleStyle.borderUpColor':
          theme === 'Cooperaty' ? '#AFD803' : '#5EBF4D',
        'mainSeriesProperties.candleStyle.borderDownColor':
          theme === 'Cooperaty' ? '#E54033' : '#CC2929',
        'mainSeriesProperties.candleStyle.wickUpColor':
          theme === 'Cooperaty' ? '#AFD803' : '#5EBF4D',
        'mainSeriesProperties.candleStyle.wickDownColor':
          theme === 'Cooperaty' ? '#E54033' : '#CC2929',
      },
    }

    tvWidgetRef.current = new widget(widgetOptions)
    tvWidgetRef.current.onChartReady(async function () {
      console.log('TRADINGVIEW', tvWidgetRef.current)

      await sleep(500) // TODO: remove this hack and find a better way to wait for the chart to be ready

      // get last bar information
      // @ts-ignore
      const bars = tvWidgetRef.current.chart().getSeries()._series
          .m_data.m_bars,
        lastBarIndex =
          bars._end -
          (currentExerciseSolution?.candles
            ? currentExerciseChart.position.postBars + 1
            : 1),
        lastBar = bars._items[lastBarIndex]

      console.log(
        'lastBar',
        lastBar,
        lastBarIndex,
        bars,
        bars._end,
        currentExerciseSolution?.candles
          ? currentExerciseChart.position.postBars
          : 0
      )

      const long: boolean =
        currentExerciseChart.position.direction == 'long_position'
      const takeProfitPrice =
        lastBar.value[4] *
        (1 +
          (long
            ? currentExerciseChart.position.takeProfit
            : -currentExerciseChart.position.takeProfit))
      const stopLossPrice =
        lastBar.value[4] *
        (1 -
          (long
            ? currentExerciseChart.position.stopLoss
            : -currentExerciseChart.position.stopLoss))

      lastBarData.current = {
        time: lastBar.exTime,
        open: lastBar.value[1],
        close: lastBar.value[4],
        percent: lastBar.value[1],
        distance: lastBar.exTime - bars._items[lastBarIndex - 1].exTime,
        takeProfitPrice,
        stopLossPrice,
        upperPrice: long ? takeProfitPrice : stopLossPrice,
        lowerPrice: long ? stopLossPrice : takeProfitPrice,
      }

      // position shape
      tvWidgetRef.current.chart().createMultipointShape(
        [
          { time: lastBarData.current.time, price: lastBarData.current.close },
          {
            time:
              lastBarData.current.time +
              lastBarData.current.distance *
                (currentExerciseChart.position.postBars - 1),
            price: lastBarData.current.close,
          },
        ],
        {
          // @ts-ignore
          shape: currentExerciseChart.position.direction,
          lock: true,
          overrides: {
            profitLevel:
              lastBarData.current.percent *
              currentExerciseChart.position.takeProfit *
              datafeed.priceScale,
            stopLevel:
              lastBarData.current.percent *
              currentExerciseChart.position.stopLoss *
              datafeed.priceScale,
          },
        }
      )

      // validation line
      validationLine.current = tvWidgetRef.current
        .chart()
        .createOrderLine({ disableUndo: false })
        .onMove(function () {
          const newValidation = priceToValidation(
            this.getPrice(),
            lastBarData.current
          ).toFixed(2)

          // TODO: Find a better approach to update the validation line
          setValidation(newValidation + 1)
          setValidation(newValidation)
        })
        .setText('Validation')
        .setQuantity(validation + '%')
        .setPrice(validationToPrice(validation as number, lastBarData.current))
    })
    //eslint-disable-next-line
  }, [theme, isMobile, currentExerciseChart, currentExerciseSolution])

  useEffect(() => {
    if (validationLine.current != null && typeof validation == 'number') {
      const actualPrice = validationLine.current.getPrice()
      if (validation > 100) {
        setValidation(100)
      } else if (validation < -100) {
        setValidation(-100)
      } else {
        const newPrice = validationToPrice(validation, lastBarData.current)
        if (newPrice === actualPrice) return
        validationLine.current.setQuantity(validation.toFixed(2) + '%')
        validationLine.current.setPrice(newPrice)
      }
    }
  }, [validation])

  return <div id={defaultProps.containerId} className="tradingview-chart" />
}

export default TVChartContainer

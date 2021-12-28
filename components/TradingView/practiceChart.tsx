import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import {
  widget,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString, IOrderLineAdapter
} from '../../public/charting_library'
import useMangoStore from '../../stores/useMangoStore'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../PracticePageGrid'
import Datafeed from './ipfs/';

// This is a basic example of how to create a TV widget
// You can add more feature such as storing charts in localStorage

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

// export interface ChartContainerState {}

const TVChartContainer = (props) => {
  const set = useMangoStore((s) => s.set)
  const { prediction } = useMangoStore((s) => s.practiceForm)
  const currentExercise = useMangoStore((s) => s.currentExercise)
  const { theme } = useTheme()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const setPrediction = (prediction) =>
    set((s) => {
      if (!Number.isNaN(parseFloat(prediction))) {
        s.practiceForm.prediction = parseFloat(prediction)
      } else {
        s.practiceForm.prediction = prediction
      }
    })

  // @ts-ignore
  const defaultProps: ChartContainerProps = {
    symbol: currentExercise.type,
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

  const predictionLine = useRef<IOrderLineAdapter | null>(null)

  const lastBarData = useRef<Record<string, number>>({})

  const datafeed = new Datafeed(["1", "5", "15", "30"]);

  useEffect(() => {
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: currentExercise.type,
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
      container_border: {background: 'transparent'},
      overrides: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        'paneProperties.background':
          theme === 'Dark' ? '#1B1B1F' : theme === 'Light' ? '#fff' : 'rgba(0,0,0,0)',
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

    const tvWidget = new widget(widgetOptions)
    tvWidgetRef.current = tvWidget

    tvWidgetRef.current.onChartReady(function () {
      console.log("WIDGET:", tvWidgetRef.current);

      // get last bar information
      // @ts-ignore
      const bars = tvWidgetRef.current.chart().getSeries()._series.m_data.m_bars,
        lastBar = bars._items[bars._end-1]

      lastBarData.current = {
          time: lastBar.exTime,
          open: lastBar.value[1],
          close: lastBar.value[4],
          percent: lastBar.value[1],
          distance: lastBar.exTime - bars._items[bars._end - 2].exTime,
          takeProfitPrice: lastBar.value[4] * (1 + props.position.takeProfit),
          stopLossPrice: lastBar.value[4] * (1 - props.position.stopLoss),
      };

      console.log(bars, lastBarData)

      // position shape
      tvWidgetRef.current.chart().createMultipointShape(
        [
          { time: lastBarData.current.time, price: lastBarData.current.close },
          {
            time: lastBarData.current.time + lastBarData.current.distance * props.position.bars,
            price: lastBarData.current.close,
          },
        ],
        {
          // @ts-ignore
          shape: props.position.direction,
          lock: true,
          overrides: {
            profitLevel: lastBarData.current.percent * props.position.takeProfit * datafeed.priceScale,
            stopLevel: lastBarData.current.percent * props.position.stopLoss * datafeed.priceScale,
          },
        },
      );

      // prediction line
      predictionLine.current = tvWidgetRef.current
        .chart()
        .createOrderLine({ disableUndo: false })
        .onMove(function () {
          // @ts-ignore
          console.log(this);
          // @ts-ignore
          const actualPrice = this.getPrice();
          let newPrice = actualPrice;

          console.log(actualPrice, lastBarData.current.takeProfitPrice);

          if (actualPrice > lastBarData.current.takeProfitPrice) newPrice = lastBarData.current.takeProfitPrice;
          else if (actualPrice < lastBarData.current.stopLossPrice) newPrice = lastBarData.current.stopLossPrice;

          const newPrediction =
            ((newPrice >= lastBarData.current.close
              ? (newPrice - lastBarData.current.close) /
              (lastBarData.current.takeProfitPrice - lastBarData.current.close)
              : (lastBarData.current.close - newPrice) /
              (lastBarData.current.stopLossPrice - lastBarData.current.close)) * 100).toFixed(2);

          setPrediction(newPrediction)
        })
        .setText('Prediction')
        .setQuantity('0%')
        .setPrice(lastBarData.current.close)
    })
    //eslint-disable-next-line
  }, [theme, isMobile])

  useEffect(() => {
    if (predictionLine.current != null && typeof prediction == 'number') {
      console.log("PREDICTION:", prediction);
      predictionLine.current.setQuantity(prediction + '%');
      const actualPrice = predictionLine.current.getPrice();
      let newPrice = lastBarData.current.close + (prediction > 0 ? (lastBarData.current.takeProfitPrice - lastBarData.current.close) : (lastBarData.current.close - lastBarData.current.stopLossPrice)) * (prediction / 100);

      console.log("ACTUAL PRICE:", actualPrice, "NEW PRICE:", newPrice, "PREDICTION", prediction, (1 + prediction / 100));

      if (newPrice > lastBarData.current.takeProfitPrice) newPrice = lastBarData.current.takeProfitPrice;
      else if (newPrice < lastBarData.current.stopLossPrice) newPrice = lastBarData.current.stopLossPrice;

      // @ts-ignore
      if (newPrice !== actualPrice) predictionLine.current.setPrice(newPrice);
    }
  }, [prediction])


  return <div id={defaultProps.containerId} className="tradingview-chart" />
}

export default TVChartContainer

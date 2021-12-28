import Head from 'next/head'
import { ThemeProvider } from 'next-themes'
import '../node_modules/react-grid-layout/css/styles.css'
import '../node_modules/react-resizable/css/styles.css'
import 'intro.js/introjs.css'
import '../styles/index.css'
import useWallet from '../hooks/useWallet'
import useHydrateStore from '../hooks/useHydrateStore'
import Notifications from '../components/elements/Notification'
import { ViewportProvider } from '../hooks/useViewport'
import BottomBar from '../components/mobile/BottomBar'
import { appWithTranslation } from 'next-i18next'

const MangoStoreUpdater = () => {
  useHydrateStore()
  useWallet()

  return null
}

function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Cooperaty</title>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="Cooperaty" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="keywords"
          content="Cooperaty, COOP, Serum, SRM, Serum DEX, DEFI, Decentralized Finance, Decentralised Finance, Crypto, ERC20, Ethereum, Decentralize, Solana, SOL, SPL, Trading, Fastest, Fast, SerumBTC, SerumUSD, SRM Tokens, SPL Tokens"
        />
        <meta
          name="description"
          content="Cooperaty - Permission-less democratic hedge fund."
        />
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/apple-touch-icon.png"
        />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CooperatyDAO" />
        <meta
          name="twitter:description"
          content="Cooperaty - Permission-less democratic hedge fund."
        />
        <meta name="twitter:image" content="/twitter-image.png" />

        <script src="/datafeeds/udf/dist/polyfills.js"/>
        <script src="/datafeeds/udf/dist/bundle.js"/>

        <link rel="manifest" href="/manifest.json"/>
      </Head>
      <Head>
        <title>Cooperaty</title>
      </Head>
      <MangoStoreUpdater />
      <ThemeProvider defaultTheme="Cooperaty">
        <ViewportProvider>
          <div className="bg-th-bkg-0 min-h-screen">
            <Component {...pageProps} />
          </div>
          <div className="md:hidden fixed bottom-0 left-0 w-full z-20">
            <BottomBar />
          </div>
          <Notifications />
        </ViewportProvider>
      </ThemeProvider>
    </>
  )
}

export default appWithTranslation(App)

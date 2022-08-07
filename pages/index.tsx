import type { NextPage } from 'next'
import Head from 'next/head'

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Speak Easy</title>
        <meta name="description" content="A peer to peer chat that is e2e encrypted" />
      </Head>

      <main>
        <h1>
          Welcome to Speak Easy
        </h1>
      </main>
    </div>
  )
}

export default Home

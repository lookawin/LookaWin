import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="c22e26a3-bf49-4ccf-9328-aafb046df577"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

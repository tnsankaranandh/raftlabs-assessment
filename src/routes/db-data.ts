import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>DB Data</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/api-data">API Data</a>
          <a href="/db-data">DB Data</a>
          <a href="/healthz">Health</a>
        </nav>
        <h1>Documents from test collection</h1>
        <div id="db-content">Loading...</div>
        <script>
          fetch('/getFromDB')
            .then(r => r.json())
            .then(data => {
              document.getElementById('db-content').innerHTML =
                '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            })
            .catch(err => {
              document.getElementById('db-content').innerHTML =
                '<p style="color:red">Error: ' + err.message + '</p>';
            });
        </script>
      </body>
    </html>
  `)
})

export default router

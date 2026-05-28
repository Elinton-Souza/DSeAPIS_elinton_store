import express from 'express'
const app = express()
const port = 3000

import routesProdutos from "./routes/produtos"
import routesClientes from "./routes/clientes"
import routesVendas from "./routes/vendas"
import routesMail from "./routes/email"

app.use(express.json())

app.use("/produtos", routesProdutos)
app.use("/clientes", routesClientes)
app.use("/email", routesMail)
app.use("/vendas", routesVendas)

app.get('/', (req, res) => {
  res.send('API: Sistema de Controle de Estoque - Loja de Roupas do Elinton')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})
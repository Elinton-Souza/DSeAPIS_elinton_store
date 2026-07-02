import express from 'express'
const app = express()
const port = 3000

import routesLogs from "./routes/logs"
import routesLogin from "./routes/login"
import routesUsuarios from "./routes/usuarios"
import routesProdutos from "./routes/produtos"
import routesClientes from "./routes/clientes"
import routesVendas from "./routes/vendas"
import routesMail from "./routes/email"
import routesRecuperarSenha from "./routes/recuperar-senha"

app.use(express.json())

app.use("/logs", routesLogs)
app.use("/", routesRecuperarSenha)
app.use("/login", routesLogin)
app.use("/usuarios", routesUsuarios)
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
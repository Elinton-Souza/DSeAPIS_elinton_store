import { prisma } from "../../lib/prisma"
import { Router } from "express"
import nodemailer from "nodemailer"
import "dotenv/config"

const router = Router()

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_EMAIL,
    pass: process.env.MAILTRAP_SENHA
  }
})

// POST /email/cliente/:id - envia historico de compras pro email do cliente
router.post("/cliente/:id", async (req, res) => {
  const { id } = req.params

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: Number(id) },
      include: {
        vendas: {
          include: {
            itens: { include: { produto: true } }
          },
          orderBy: { data: "desc" }
        }
      }
    })

    if (!cliente) {
      res.status(404).json({ error: "Cliente não encontrado." })
      return
    }

    let listaVendas = ""
    if (cliente.vendas.length === 0) {
      listaVendas = "<p>Você ainda não tem compras registradas.</p>"
    } else {
      listaVendas = cliente.vendas.map(venda => {
        const itensHtml = venda.itens.map(item =>
          `<li>${item.produto.nome} — ${item.qtd}x R$ ${Number(item.preco).toFixed(2)}</li>`
        ).join("")
        return `
          <h3>Venda #${venda.id} — ${new Date(venda.data).toLocaleDateString("pt-BR")}</h3>
          <ul>${itensHtml}</ul>
          <p><strong>Total: R$ ${Number(venda.totalNF).toFixed(2)}</strong></p>
          <hr>
        `
      }).join("")
    }

    const html = `
      <h1>Olá, ${cliente.nome}!</h1>
      <p>Segue o histórico das suas compras na Loja do Elinton:</p>
      ${listaVendas}
      <p><strong>Total acumulado em compras: R$ ${Number(cliente.gastos).toFixed(2)}</strong></p>
      <p>Obrigado pela preferência!</p>
    `

    await transporter.sendMail({
      from: '"Loja do Elinton" <loja@elinton.com>',
      to: cliente.email,
      subject: "Seu histórico de compras",
      html
    })

    res.status(200).json({ message: `E-mail enviado para ${cliente.email}.` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erro ao enviar e-mail." })
  }
})

export default router
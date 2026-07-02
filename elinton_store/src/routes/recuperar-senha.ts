import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"
import bcrypt from "bcrypt"
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

function gerarCodigo(): string {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let codigo = ""
  for (let i = 0; i < 4; i++) {
    codigo += caracteres[Math.floor(Math.random() * caracteres.length)]
  }
  return codigo
}

const solicitarSchema = z.object({
  email: z.email({ message: "E-mail inválido." })
})

// POST /recuperar-senha - solicita recuperação e envia código por e-mail
router.post("/recuperar-senha", async (req, res) => {
  const valida = solicitarSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ error: valida.error })
    return
  }

  const { email } = valida.data

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario) {
      res.status(200).json({ message: "Se o email estiver cadastrado, você receberá um código de recuperação." })
      return
    }

    const codigo = gerarCodigo()
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { codigoRecuperacao: codigo }
    })

    await transporter.sendMail({
      from: '"Loja do Elinton" <naoresponder@elinton.com>',
      to: usuario.email,
      subject: "Código de Recuperação de Senha",
      html: `
        <h1>Olá, ${usuario.nome}!</h1>
        <p>Você solicitou a recuperação de senha da sua conta na Loja do Elinton.</p>
        <p>Seu código de recuperação é:</p>
        <h2 style="background:#f0f0f0;padding:15px;text-align:center;letter-spacing:8px;">${codigo}</h2>
        <p>Use este código na tela de alteração de senha.</p>
        <p><small>Se você não solicitou esta recuperação, ignore este email.</small></p>
      `
    })

    res.status(200).json({ message: "Código de recuperação enviado para seu email." })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erro ao processar recuperação de senha." })
  }
})

const alterarSchema = z.object({
  email: z.email({ message: "E-mail inválido." }),
  codigo: z.string().length(4, { message: "Código deve ter 4 caracteres." }),
  novaSenha: z.string()
    .min(8, { message: "Senha deve ter no mínimo 8 caracteres." })
    .regex(/[a-z]/, { message: "Senha deve ter ao menos 1 letra minúscula." })
    .regex(/[A-Z]/, { message: "Senha deve ter ao menos 1 letra maiúscula." })
    .regex(/[0-9]/, { message: "Senha deve ter ao menos 1 número." })
    .regex(/[^a-zA-Z0-9]/, { message: "Senha deve ter ao menos 1 símbolo." })
})

// POST /alterar-senha - valida código e atualiza a senha
router.post("/alterar-senha", async (req, res) => {
  const valida = alterarSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ error: valida.error })
    return
  }

  const { email, codigo, novaSenha } = valida.data

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario) {
      res.status(404).json({ error: "Usuário não encontrado." })
      return
    }

    if (!usuario.codigoRecuperacao || usuario.codigoRecuperacao !== codigo.toUpperCase()) {
      res.status(400).json({ error: "Código de recuperação inválido." })
      return
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10)

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: senhaHash,
        codigoRecuperacao: null,
        tentativasInvalidas: 0,
        bloqueado: false
      }
    })

    await prisma.log.create({
      data: {
        usuarioId: usuario.id,
        descricao: "SENHA_ALTERADA",
        complemento: "Senha alterada via recuperação por email"
      }
    })

    res.status(200).json({ message: "Senha alterada com sucesso." })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erro ao alterar senha." })
  }
})

export default router

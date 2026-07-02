import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import "dotenv/config"

const router = Router()

const loginSchema = z.object({
  email: z.email({ message: "E-mail inválido." }),
  senha: z.string().min(1, { message: "Senha é obrigatória." })
})

// POST /login - autentica usuário e retorna token JWT
router.post("/", async (req, res) => {
  const valida = loginSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ error: valida.error })
    return
  }

  const { email, senha } = valida.data

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario) {
      res.status(404).json({ error: "Credenciais inválidas." })
      return
    }

    if (usuario.bloqueado) {
      res.status(403).json({
        error: "Usuário bloqueado por excesso de tentativas inválidas. Contate o administrador."
      })
      return
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha)

    if (!senhaValida) {
      const novasTentativas = usuario.tentativasInvalidas + 1
      const bloqueado = novasTentativas >= 3

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { tentativasInvalidas: novasTentativas, bloqueado }
      })

      await prisma.log.create({
        data: {
          usuarioId: usuario.id,
          descricao: "TENTATIVA_LOGIN_INVALIDA",
          complemento: `Tentativa ${novasTentativas}/3${bloqueado ? " - USUARIO BLOQUEADO" : ""}`
        }
      })

      res.status(401).json({
        error: bloqueado
          ? "Credenciais inválidas. Usuário bloqueado por excesso de tentativas."
          : `Credenciais inválidas. Tentativas restantes: ${3 - novasTentativas}`
      })
      return
    }

    const ultimoLoginAnterior = usuario.ultimoLogin

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        ultimoLogin: new Date(),
        tentativasInvalidas: 0
      }
    })

    await prisma.log.create({
      data: {
        usuarioId: usuario.id,
        descricao: "LOGIN",
        complemento: `Usuario ${usuario.nome} logou no sistema`
      }
    })

    const token = jwt.sign(
      { userId: usuario.id, email: usuario.email },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    )

    const mensagem = ultimoLoginAnterior
      ? `Bem-vindo, ${usuario.nome}! Seu último acesso foi em ${ultimoLoginAnterior.toLocaleString("pt-BR")}`
      : `Bem-vindo, ${usuario.nome}! Este é o seu primeiro acesso ao sistema.`

    res.status(200).json({
      mensagem,
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erro ao fazer login." })
  }
})

export default router

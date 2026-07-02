import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"
import bcrypt from "bcrypt"

const router = Router()

const usuarioSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  email: z.email({ message: "E-mail inválido." }),
  senha: z.string()
    .min(8, { message: "Senha deve ter no mínimo 8 caracteres." })
    .regex(/[a-z]/, { message: "Senha deve ter ao menos 1 letra minúscula." })
    .regex(/[A-Z]/, { message: "Senha deve ter ao menos 1 letra maiúscula." })
    .regex(/[0-9]/, { message: "Senha deve ter ao menos 1 número." })
    .regex(/[^a-zA-Z0-9]/, { message: "Senha deve ter ao menos 1 símbolo." })
})

// GET /usuarios - lista todos os usuários
router.get("/", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        ultimoLogin: true,
        tentativasInvalidas: true,
        bloqueado: true,
      },
      orderBy: { nome: "asc" }
    })
    res.status(200).json(usuarios)
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuarios." })
  }
})

// POST /usuarios - cria um novo usuário
router.post("/", async (req, res) => {
  const valida = usuarioSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ error: valida.error })
    return
  }

  const { nome, email, senha } = valida.data

  try {
    const emailExiste = await prisma.usuario.findUnique({ where: { email } })
    if (emailExiste) {
      res.status(409).json({ error: "Já existe um usuário com esse e-mail." })
      return
    }

    const senhaHash = await bcrypt.hash(senha, 10)

    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash },
      select: {
        id: true,
        nome: true,
        email: true,
      }
    })

    res.status(201).json(usuario)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Erro ao criar usuário." })
  }
})

export default router

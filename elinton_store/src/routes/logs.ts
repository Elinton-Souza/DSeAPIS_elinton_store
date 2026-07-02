import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { verificaToken } from "../../lib/verificaToken"

const router = Router()

// GET /logs - lista todos os logs com nome do usuário
router.get("/", verificaToken, async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      include: {
        usuario: {
          select: { id: true, nome: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    res.status(200).json(logs)
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar logs." })
  }
})

// GET /logs/usuario/:id - pesquisa logs de um usuário específico
router.get("/usuario/:id", verificaToken, async (req, res) => {
  const { id } = req.params
  try {
    const logs = await prisma.log.findMany({
      where: { usuarioId: Number(id) },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    res.status(200).json(logs)
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar logs do usuário." })
  }
})

export default router

import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"

const router = Router()

const clienteSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: "CPF deve estar no formato XXX.XXX.XXX-XX, com 11 digitos."
  }),
  email: z.email({ message: "Email inválido." })
})

// GET /clientes - lista todos os clientes ativos (soft delete filtrado)
router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { deleted: false },
      orderBy: { nome: "asc" }
    })
    res.status(200).json(clientes)
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar clientes." })
  }
})

// GET /clientes/:id - busca um cliente ativo por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: Number(id),
        deleted: false
      },
      include: { vendas: true }
    })
    if (!cliente) {
      res.status(404).json({ error: "Cliente não encontrado." })
      return
    }
    res.status(200).json(cliente)
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar cliente." })
  }
})

// POST /clientes - cria um novo cliente
router.post("/", async (req, res) => {
  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ error: valida.error })
    return
  }
  try {
    const cliente = await prisma.cliente.create({
      data: valida.data
    })
    res.status(201).json(cliente)
  } catch (error: any) {
    if (error?.code === "P2002") {
      res.status(409).json({ error: "Já existe um cliente com esse CPF." })
      return
    }
    res.status(500).json({ error: "Erro ao criar cliente." })
  }
})

// PUT /clientes/:id - atualiza um cliente existente
router.put("/:id", async (req, res) => {
  const { id } = req.params
  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ error: valida.error })
    return
  }
  try {
    const cliente = await prisma.cliente.update({
      where: { id: Number(id) },
      data: valida.data
    })
    res.status(200).json(cliente)
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar cliente." })
  }
})

// DELETE /clientes/:id - soft delete (marca deleted=true)
router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: Number(id), deleted: false }
    })
    if (!cliente) {
      res.status(404).json({ error: "Cliente não encontrado." })
      return
    }

    await prisma.cliente.update({
      where: { id: Number(id) },
      data: {
        deleted: true,
        deletedAt: new Date()
      }
    })

    res.status(200).json({ message: "Cliente excluído com sucesso (soft delete)." })
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir cliente." })
  }
})

export default router

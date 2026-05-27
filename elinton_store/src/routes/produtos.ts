import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"

const router = Router()

const produtoSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres."}),
  qtd: z.number().int().nonnegative({ message: "Quantidade deve ser >= 0." }),
  preco: z.number().positive({ message: "Preço deve ser positivo." }),
  marca: z.string().min(1, { message: "Marca é obrigatória." }),
  categoria: z.enum(["Camisa", "Calca", "Vestido", "Calcado", "Acessorio"])
})

// GET /produtos - Listar todos os produtos
router.get("/", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
        orderBy: { nome: "asc" }
    })
    res.status(200).json(produtos)
} catch (error) {
    res.status(500).json({ error: "Erro ao buscar produtos." })
}
})

//GET /produtos/:id - busca um produto por ID
router.get("/:id", async (req, res) => {
    const { id } = req.params
    try {
        const produto = await prisma.produto.findUnique({
            where: { id: Number(id) }
        })
        if (!produto) {
            res.status(404).json({ error: "Produto não encontrado." })
            return
        }
        res.status(200).json(produto)
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar produtos." })
    }
})

//POST /produtos - criar um novo produto
router.post("/", async (req, res) => {
    const valida = produtoSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ error: valida.error })
        return
    }
    try {
        const produto = await prisma.produto.create({
            data: valida.data
        })
        res.status(201).json(produto)
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar produto." })
    }
})

//PUT /produtos/:id - atualizar um produto existente
router.put("/:id", async (req, res) => {
    const { id } = req.params
    const valida = produtoSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ error: valida.error })
        return
    }
    try {
        const produto = await prisma.produto.update({
            where: { id: Number(id) },
            data: valida.data
        })
        res.status(200).json(produto)
    } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar produto." })
    }
})

//DELETE /produtos/:id - excluir um produto
router.delete("/:id", async (req, res) => {
    const { id } = req.params
    try {
        const produto = await prisma.produto.delete({
            where: { id: Number(id) }
        })
        res.status(200).json({ message: "Produto excluído com sucesso." })
    } catch (error) {
        res.status(500).json({ error: "Erro ao excluir produto." })
    }
})

export default router

import { prisma } from "../../lib/prisma";
import { Router } from "express";
import { z } from "zod";

const router = Router();

const itemVendaSchema = z.object({
  produtoId: z.number().int().positive(),
  qtd: z.number().int().positive({
    message: "A quantidade deve ser positiva."
  })
})

const vendaSchema = z.object({
  clienteId: z.number().int().positive(),
  itens: z.array(itemVendaSchema).min(1, {
    message: "A venda deve conter pelo menos um item."
  })
})

// GET /vendas - Listar todas as vendas com clientes + itens + produtos aninhados
router.get("/", async (req, res) => {
  try {
    const vendas = await prisma.venda.findMany({
        include: {
          cliente: true,
          itens: {
            include: {
              produto: true
            }
          }
        },
         orderBy: { data: "desc" }
      })
      res.status(200).json(vendas)
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar vendas." });
  }
});

// GET /vendas/:id - Busca uma venda específica
router.get("/:id", async (req, res) => {
    const { id } = req.params
    try {
    const venda = await prisma.venda.findUnique({
      where: { id: Number(id) },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true
          }
        }
      }
    })
    if (!venda) {
      res.status(404).json({ error: "Venda não encontrada." })
      return
    }
    res.status(200).json(venda);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar venda." });
  }
});

// POST /vendas - Criar uma nova venda
router.post("/", async (req, res) => {
    const valida = vendaSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ error: valida.error })
        return 
    }
    const { clienteId, itens } = valida.data

    try {
        const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } })
        if (!cliente) {
            res.status(404).json({ error: "Cliente não encontrado." })
            return
        }

    const produtosIds = itens.map(item => item.produtoId)
    const produtos = await prisma.produto.findMany({
        where: { id: { in: produtosIds } }
    })

    let totalNF = 0
    for (const item of itens) {
        const produto = produtos.find(p => p.id === item.produtoId)

        if (!produto) {
            res.status(404).json({ error: `Produto com ID ${item.produtoId} não encontrado.` })
            return
        }

        if (produto.qtd < item.qtd) {
            res.status(400).json({ error: `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.qtd}, solicitado: ${item.qtd}.` })
            return

        }
        totalNF += Number(produto.preco) * item.qtd
    }

    const resultado = await prisma.$transaction(async (tx) => {
        const novaVenda = await tx.venda.create({
            data: {
                clienteId,
                totalNF
            }
        })

        for (const item of itens) {
            const produto = produtos.find(p => p.id === item.produtoId)!

            await tx.itemVenda.create({
                data: {
                    vendaId: novaVenda.id,
                    produtoId: item.produtoId,
                    qtd: item.qtd,
                    preco: Number(produto.preco)
                }
            })
            
            await tx.produto.update({
                where: { id: item.produtoId },
                data: { qtd: { decrement: item.qtd } }
            })
        }

        await tx.cliente.update({
            where: { id: clienteId },
            data: { gastos: { increment: totalNF } }
        })

        return tx.venda.findUnique({
            where: { id: novaVenda.id },
            include: {
                cliente: true,
                itens: {
                    include: {
                        produto: true
                    }
                }
            }
        })
    })

    res.status(201).json(resultado)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Erro ao criar venda." })
    }
})

export default router
import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import "dotenv/config"

declare global {
  namespace Express {
    interface Request {
      userId?: number
      userEmail?: string
    }
  }
}

export function verificaToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({ error: "Token não fornecido." })
    return
  }

  const [scheme, token] = authHeader.split(" ")

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Formato de token inválido. Use: Bearer <token>" })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number, email: string }
    req.userId = decoded.userId
    req.userEmail = decoded.email
    next()
  } catch (error) {
    res.status(401).json({ error: "Token inválido ou expirado." })
    return
  }
}

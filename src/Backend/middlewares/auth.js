/* eslint-disable no-unused-vars */
import jwt from 'jsonwebtoken'

// Verificar token y rol
export const verificarToken = (req, res, next) => {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    return res.status(503).json({ error: 'Autenticación no configurada: define JWT_SECRET con al menos 32 caracteres' })
  }

  const [scheme, token] = req.get('authorization')?.trim().split(/\s+/, 2) || []
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Se requiere un token Bearer válido' })
  }

  try {
    const decoded = jwt.verify(token, secret)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

export const soloAdmin = (req, res, next) => {
  if (req.user?.rol?.trim().toLowerCase() !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado: se requiere el rol administrador' })
  }
  next()
}

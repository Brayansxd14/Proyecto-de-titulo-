/* eslint-disable no-unused-vars */
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'clave_secreta_super_segura'

// Verificar token y rol
export const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) return res.status(403).send('Token requerido')

  try {
    const decoded = jwt.verify(token, SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).send('Token inválido')
  }
}

export const soloAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).send('Acceso denegado: solo admin')
  }
  next()
}

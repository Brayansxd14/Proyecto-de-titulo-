import { Link } from 'react-router-dom'
import './RRHH.css'

const modulos = [
  { ruta: '/usuarios', icono: '👥', titulo: 'Usuarios', descripcion: 'Gestiona cuentas, roles y estados de acceso.' },
  { ruta: '/empleados', icono: '🧑‍💼', titulo: 'Empleados', descripcion: 'Administra datos, cargos y salarios.' },
  { ruta: '/asistencia', icono: '📝', titulo: 'Asistencia', descripcion: 'Consulta reportes y registros del reloj.' },
  { ruta: '/rrhh/vacaciones', icono: '🌴', titulo: 'Vacaciones', descripcion: 'Carga y consulta días de vacaciones.' },
  { ruta: '/rrhh/permisos', icono: '📄', titulo: 'Permisos', descripcion: 'Controla solicitudes y permisos.' },
  { ruta: '/rrhh/bonos', icono: '🎁', titulo: 'Bonos asignados', descripcion: 'Registra bonos por empleado y período.' },
  { ruta: '/rrhh/salarios', icono: '💰', titulo: 'Salarios', descripcion: 'Revisa remuneraciones vigentes.' },
  { ruta: '/rrhh/liquidaciones', icono: '🧾', titulo: 'Liquidación de sueldo', descripcion: 'Prepara la información para liquidaciones.' }
]

const RRHH = () => (
  <section className="rrhh-page">
    <header className="rrhh-header">
      <p className="rrhh-eyebrow">Área administrativa</p>
      <h2>Recursos Humanos</h2>
      <p>Un solo espacio para administrar personas, asistencia y remuneraciones del taller.</p>
    </header>

    <div className="rrhh-grid">
      {modulos.map(modulo => (
        <Link className="rrhh-module" to={modulo.ruta} key={modulo.ruta}>
          <span className="rrhh-module-icon" aria-hidden="true">{modulo.icono}</span>
          <span>
            <strong>{modulo.titulo}</strong>
            <small>{modulo.descripcion}</small>
          </span>
          <span className="rrhh-module-arrow" aria-hidden="true">→</span>
        </Link>
      ))}
    </div>

    <div className="rrhh-note">
      <strong>Asistencia integrada</strong>
      <span>El reloj con tarjeta sigue siendo la fuente oficial. Esta área está preparada para consultar o importar sus registros sin duplicar marcaciones.</span>
    </div>
  </section>
)

export default RRHH

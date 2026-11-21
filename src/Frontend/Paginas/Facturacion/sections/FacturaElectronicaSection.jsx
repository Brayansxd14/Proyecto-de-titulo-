import { FiAlertCircle, FiShield } from 'react-icons/fi'

const documentTypes = [
  ['33', 'Factura electrónica afecta'],
  ['34', 'Factura electrónica exenta'],
  ['39', 'Boleta electrónica afecta'],
  ['41', 'Boleta electrónica exenta'],
  ['61', 'Nota de crédito electrónica']
]

export default function FacturaElectronicaSection({ status, loading, error }) {
  const missingCredentials = status?.missingCredentials || ['LIBREDTE_HASH', 'LIBREDTE_RUT']
  const credentialsConfigured = status?.credentialsConfigured

  return (
    <section className="billing-electronic" aria-labelledby="billing-electronic-title">
      <div className="billing-electronic-heading">
        <div>
          <span className="billing-eyebrow">PREPARACIÓN PARA DOCUMENTOS TRIBUTARIOS</span>
          <h2 id="billing-electronic-title">Conexión con el SII</h2>
          <p>Integración prevista mediante LibreDTE. La emisión tributaria está bloqueada mientras el sistema sea un piloto.</p>
        </div>
        <span className="billing-electronic-badge">
          {loading ? 'Verificando' : 'Piloto · emisión desactivada'}
        </span>
      </div>

      {error ? (
        <div className="billing-electronic-message error" role="alert">
          <FiAlertCircle /> No se pudo consultar el estado de la preparación: {error}
        </div>
      ) : (
        <div className="billing-electronic-message" role="status">
          <FiShield />
          {loading
            ? 'Consultando la configuración segura del servidor.'
            : credentialsConfigured
              ? 'Se detectaron credenciales del proveedor en el servidor. No se muestran aquí y esto no habilita ni confirma la emisión ante el SII.'
              : `Variables previstas para una futura integración: ${missingCredentials.join(', ')}. No las agregues durante el piloto.`}
        </div>
      )}

      <div className="billing-electronic-details">
        <div>
          <h3>Documentos contemplados</h3>
          <ul className="billing-dte-types">
            {documentTypes.map(([code, label]) => (
              <li key={code}><span>{code}</span>{label}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Requisitos antes de activarla</h3>
          <ol>
            <li>Formalizar el inicio de actividades y habilitar el RUT emisor para facturación electrónica ante el SII.</li>
            <li>Completar la certificación/pruebas del emisor en el ambiente del SII y obtener autorización para operar.</li>
            <li>Contar con certificado digital vigente, folios CAF autorizados por tipo de DTE y resguardar su acceso.</li>
            <li>Contratar/configurar LibreDTE: RUT del emisor y token/API hash únicamente como secretos del backend.</li>
            <li>Implementar y probar emisión, firma, envío, consulta de aceptación/rechazo, XML/PDF, notas de crédito y contingencia.</li>
            <li>Validar IVA, datos tributarios, numeración y obligaciones de conservación con un contador antes de producción.</li>
          </ol>
          <p className="billing-electronic-note">
            Esta pantalla es una preparación, no una conexión activa. No se emiten DTE, no se contacta al SII ni al proveedor y las facturas internas siguen sin validez tributaria. Activar credenciales por sí solas no habilita la emisión.
          </p>
        </div>
      </div>
    </section>
  )
}

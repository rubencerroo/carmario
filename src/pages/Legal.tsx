import { Link } from 'react-router-dom'
import { ADMIN_EMAIL } from '../lib/types'

function Wrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-5 py-10">
      <Link to="/" className="text-sm text-blush-500 hover:text-blush-700">
        ← Volver
      </Link>
      <h1 className="font-display mt-4 mb-6 text-3xl text-blush-800">{title}</h1>
      <div className="space-y-4 text-sm leading-relaxed text-blush-700 [&_h2]:font-display [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:text-blush-800 [&_a]:text-blush-600 [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
      <p className="mt-10 text-xs text-blush-300">Última actualización: 17 de junio de 2026</p>
    </div>
  )
}

export function Terms() {
  return (
    <Wrapper title="Términos y condiciones">
      <p>
        Bienvenido/a a <strong>Carmario</strong>, una aplicación personal para organizar tu armario,
        crear outfits y llevar un diario de looks. Al crear una cuenta y usar la app aceptas estas
        condiciones.
      </p>

      <h2>1. Uso de la aplicación</h2>
      <p>
        Carmario es un proyecto de uso personal y para un círculo cercano. Te comprometes a usarla de
        forma lícita y a no subir contenido ilegal, ofensivo o que infrinja derechos de terceros. Eres
        responsable de la información y las fotos que subes a tu cuenta.
      </p>

      <h2>2. Tu cuenta</h2>
      <ul>
        <li>Necesitas un email y una contraseña para registrarte.</li>
        <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
        <li>Cada usuario solo tiene acceso a sus propios datos.</li>
      </ul>

      <h2>3. Disponibilidad y garantías</h2>
      <p>
        La app se ofrece "tal cual", sin garantías de disponibilidad continua. Al tratarse de un
        proyecto personal sobre servicios gratuitos, pueden producirse interrupciones, pérdidas de
        datos o cambios sin previo aviso. Te recomendamos no usarla como único lugar de almacenamiento
        de información importante.
      </p>

      <h2>4. Propiedad del contenido</h2>
      <p>
        Las fotos y datos que subes siguen siendo tuyos. Nos limitamos a almacenarlos para prestarte el
        servicio. No los usamos con fines comerciales ni los cedemos a terceros.
      </p>

      <h2>5. Baja</h2>
      <p>
        Puedes solicitar la eliminación de tu cuenta y de todos tus datos escribiendo a{' '}
        <a href={`mailto:${ADMIN_EMAIL}`}>{ADMIN_EMAIL}</a>.
      </p>

      <h2>6. Contacto</h2>
      <p>
        Para cualquier duda sobre estos términos: <a href={`mailto:${ADMIN_EMAIL}`}>{ADMIN_EMAIL}</a>.
      </p>

      <p className="pt-4">
        Consulta también nuestra <Link to="/privacidad">Política de privacidad</Link>.
      </p>
    </Wrapper>
  )
}

export function Privacy() {
  return (
    <Wrapper title="Política de privacidad (RGPD)">
      <p>
        Esta política explica qué datos personales tratamos en <strong>Carmario</strong> y cómo, de
        acuerdo con el Reglamento General de Protección de Datos (RGPD) y la normativa española de
        protección de datos.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable de Carmario. Puedes contactar en{' '}
        <a href={`mailto:${ADMIN_EMAIL}`}>{ADMIN_EMAIL}</a> para cualquier cuestión relacionada con tus
        datos.
      </p>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li>
          <strong>Datos de cuenta:</strong> tu dirección de email y una contraseña (almacenada cifrada,
          nunca en texto plano).
        </li>
        <li>
          <strong>Contenido que subes:</strong> prendas, outfits, deseos, viajes, notas, fotografías y
          fechas del calendario.
        </li>
        <li>
          <strong>Registros de actividad:</strong> para mantener y depurar la app, guardamos un
          registro de acciones (páginas visitadas, creaciones/ediciones/borrados, inicios de sesión y
          errores), con fecha y hora.
        </li>
      </ul>

      <h2>3. Para qué y con qué base legal</h2>
      <ul>
        <li>Prestarte el servicio (gestionar tu armario). Base legal: ejecución del servicio y tu consentimiento.</li>
        <li>Mantener la seguridad y corregir errores (registros de actividad). Base legal: interés legítimo.</li>
      </ul>
      <p>No usamos tus datos para publicidad ni los vendemos a terceros.</p>

      <h2>4. Dónde se guardan</h2>
      <p>
        Los datos se almacenan en <strong>Supabase</strong> (base de datos y fotos) con servidores en
        la <strong>Unión Europea</strong> (región de Francia), y la app se sirve a través de Cloudflare.
        Estos proveedores actúan como encargados del tratamiento.
      </p>

      <h2>5. Cuánto tiempo</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa. Si solicitas la baja, los eliminamos. Los
        registros de actividad pueden conservarse un tiempo limitado para fines de seguridad y
        depuración.
      </p>

      <h2>6. Tus derechos</h2>
      <p>Puedes ejercer en cualquier momento tus derechos de:</p>
      <ul>
        <li>Acceso a tus datos.</li>
        <li>Rectificación de datos inexactos.</li>
        <li>Supresión ("derecho al olvido").</li>
        <li>Portabilidad de tus datos.</li>
        <li>Oposición y limitación del tratamiento.</li>
      </ul>
      <p>
        Para ejercerlos, escribe a <a href={`mailto:${ADMIN_EMAIL}`}>{ADMIN_EMAIL}</a>. También tienes
        derecho a reclamar ante la Agencia Española de Protección de Datos (
        <a href="https://www.aepd.es" target="_blank" rel="noreferrer">www.aepd.es</a>).
      </p>

      <h2>7. Cookies y tecnologías similares</h2>
      <p>
        Solo usamos almacenamiento local del navegador imprescindible para mantener tu sesión iniciada.
        No usamos cookies de publicidad ni de seguimiento de terceros.
      </p>

      <p className="pt-4">
        Consulta también nuestros <Link to="/terminos">Términos y condiciones</Link>.
      </p>
    </Wrapper>
  )
}

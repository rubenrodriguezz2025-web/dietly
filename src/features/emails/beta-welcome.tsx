import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface BetaWelcomeEmailProps {
  name?: string | null;
  signupUrl: string;
}

export function BetaWelcomeEmail({ name, signupUrl }: BetaWelcomeEmailProps) {
  const saludo = name ? `Hola ${name},` : 'Hola,';

  return (
    <Html lang='es'>
      <Head />
      <Preview>Ya tienes acceso a Dietly — te cuento cómo empezar 🎉</Preview>
      <Body style={bodyStyle}>
        {/* Header */}
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={logoStyle}>dietly</Text>
          </Section>

          {/* Contenido principal */}
          <Section style={contentStyle}>
            <Text style={greetingStyle}>{saludo}</Text>

            <Text style={textStyle}>
              Eres uno de los primeros nutricionistas en probar Dietly y eso no es casualidad —
              gracias por confiar en el proyecto desde el principio.
            </Text>

            <Text style={textStyle}>
              Tienes <strong>acceso completo y gratuito durante 3 meses</strong>. Sin tarjeta, sin
              compromiso. Lo único que te pido a cambio es que me cuentes qué funciona y qué no.
            </Text>

            <Text style={textStyle}>Para empezar:</Text>

            {/* Pasos */}
            <Section style={stepsContainerStyle}>
              <Section style={stepStyle}>
                <Text style={stepNumberStyle}>1</Text>
                <Text style={stepTextStyle}>
                  Haz clic en el botón de abajo — <strong>tu email ya viene relleno</strong>
                </Text>
              </Section>
              <Section style={stepStyle}>
                <Text style={stepNumberStyle}>2</Text>
                <Text style={stepTextStyle}>Crea tu primer paciente</Text>
              </Section>
              <Section style={stepStyle}>
                <Text style={stepNumberStyle}>3</Text>
                <Text style={stepTextStyle}>
                  Pulsa <strong>&quot;Generar plan&quot;</strong> — en 2 minutos tienes el borrador
                  listo
                </Text>
              </Section>
              <Section style={stepStyle}>
                <Text style={stepNumberStyle}>4</Text>
                <Text style={stepTextStyle}>Revísalo, apruébalo y envíaselo a tu paciente</Text>
              </Section>
            </Section>

            {/* CTA */}
            <Section style={ctaContainerStyle}>
              <Button href={signupUrl} style={buttonStyle}>
                Acceder a Dietly →
              </Button>
            </Section>

            <Hr style={hrStyle} />

            <Text style={textStyle}>
              Si algo no funciona o tienes cualquier duda, escríbeme directamente por WhatsApp —
              respondo yo personalmente.
            </Text>

            {/* Firma */}
            <Text style={signatureStyle}>
              <strong>Rubén</strong>
              <br />
              Fundador de Dietly
            </Text>

            {/* PD */}
            <Text style={psStyle}>
              <em>
                PD: Si ves algo que mejorarías o que te falta, dímelo. Tu feedback en estas primeras
                semanas vale más que cualquier encuesta.
              </em>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default BetaWelcomeEmail;

// ── Estilos ──────────────────────────────────────────────────────────────────

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#0f1117',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: '0',
  padding: '40px 16px',
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#1a1d27',
  borderRadius: '12px',
  maxWidth: '520px',
  margin: '0 auto',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  backgroundColor: '#1a7a45',
  padding: '28px 40px',
};

const logoStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '26px',
  fontWeight: '700',
  letterSpacing: '-0.5px',
  margin: '0',
};

const contentStyle: React.CSSProperties = {
  padding: '36px 40px',
};

const greetingStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: '600',
  margin: '0 0 20px',
};

const textStyle: React.CSSProperties = {
  color: '#c8cdd8',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const stepsContainerStyle: React.CSSProperties = {
  margin: '24px 0',
};

const stepStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: '12px',
};

const stepNumberStyle: React.CSSProperties = {
  backgroundColor: '#1a7a45',
  borderRadius: '50%',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '13px',
  fontWeight: '700',
  height: '24px',
  lineHeight: '24px',
  margin: '0 12px 0 0',
  minWidth: '24px',
  textAlign: 'center',
  width: '24px',
};

const stepTextStyle: React.CSSProperties = {
  color: '#c8cdd8',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
};

const ctaContainerStyle: React.CSSProperties = {
  margin: '32px 0 24px',
  textAlign: 'center',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#1a7a45',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: '600',
  padding: '14px 32px',
  textDecoration: 'none',
};

const hrStyle: React.CSSProperties = {
  borderColor: '#2a2d3a',
  margin: '24px 0',
};

const signatureStyle: React.CSSProperties = {
  color: '#c8cdd8',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 16px',
};

const psStyle: React.CSSProperties = {
  color: '#7a8094',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
};

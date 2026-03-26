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
}

export function BetaWelcomeEmail({ name }: BetaWelcomeEmailProps) {
  const saludo = name ? `Hola ${name},` : 'Hola,';

  return (
    <Html lang='es'>
      <Head />
      <Preview>Ya tienes acceso a Dietly — bienvenido/a a la beta 🎉</Preview>
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
              Has sido seleccionado/a como uno de los primeros beta users de Dietly. Nos alegra
              mucho tenerte con nosotros.
            </Text>

            <Text style={textStyle}>
              Durante los próximos <strong>3 meses tienes acceso completo y gratuito</strong> a
              todas las funcionalidades: generación de planes nutricionales, PDF con tu branding y
              app web para tus pacientes.
            </Text>

            <Text style={textStyle}>Para empezar, sigue estos pasos:</Text>

            {/* Pasos */}
            <Section style={stepsContainerStyle}>
              <Section style={stepStyle}>
                <Text style={stepNumberStyle}>1</Text>
                <Text style={stepTextStyle}>
                  Ve a <strong>dietly.es</strong>
                </Text>
              </Section>
              <Section style={stepStyle}>
                <Text style={stepNumberStyle}>2</Text>
                <Text style={stepTextStyle}>
                  Haz clic en <strong>&quot;Registrarse&quot;</strong>
                </Text>
              </Section>
              <Section style={stepStyle}>
                <Text style={stepNumberStyle}>3</Text>
                <Text style={stepTextStyle}>Usa este email para crear tu cuenta</Text>
              </Section>
              <Section style={stepStyle}>
                <Text style={stepNumberStyle}>4</Text>
                <Text style={stepTextStyle}>
                  Ya tienes <strong>acceso completo — 3 meses gratis</strong>
                </Text>
              </Section>
            </Section>

            {/* CTA */}
            <Section style={ctaContainerStyle}>
              <Button href='https://dietly.es/register' style={buttonStyle}>
                Acceder a Dietly
              </Button>
            </Section>

            <Hr style={hrStyle} />

            {/* Firma */}
            <Text style={signatureStyle}>
              Un saludo,
              <br />
              <strong>Rubén</strong>
              <br />
              Fundador de Dietly
            </Text>

            {/* PS */}
            <Text style={psStyle}>
              <em>
                PS: Si tienes cualquier duda escríbeme directamente respondiendo a este email o por
                Instagram.
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

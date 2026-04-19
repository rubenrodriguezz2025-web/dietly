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

interface UpsellEmailProps {
  name: string;
  pricingUrl: string;
}

export function UpsellEmail({ name, pricingUrl }: UpsellEmailProps) {
  return (
    <Html lang='es'>
      <Head />
      <Preview>¿Qué tal con Dietly, {name}? 🌱</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>dietly</Text>
          </Section>

          {/* Contenido */}
          <Section style={contentStyle}>
            <Text style={greetingStyle}>Hola, {name} 🌱</Text>

            <Text style={textStyle}>
              Llevas unos días probando Dietly. Espero que los primeros planes te hayan ahorrado el
              rato habitual delante del Excel.
            </Text>

            <Text style={textStyle}>
              Si quieres seguir usándolo con todos tus pacientes, estos son los planes disponibles:
            </Text>

            {/* Plan Básico */}
            <Section style={planCardStyle}>
              <Text style={planNameStyle}>Básico</Text>
              <Text style={planPriceStyle}>
                46€<span style={planPriceUnitStyle}>/mes</span>
              </Text>
              <Text style={planFeatureStyle}>Hasta 30 pacientes activos</Text>
              <Text style={planFeatureStyle}>Generación IA ilimitada</Text>
              <Text style={planFeatureStyle}>PDF con tu logo y colores</Text>
            </Section>

            {/* Plan Pro */}
            <Section style={planCardHighlightStyle}>
              <Text style={planBadgeStyle}>RECOMENDADO</Text>
              <Text style={planNameStyle}>Pro</Text>
              <Text style={planPriceStyle}>
                89€<span style={planPriceUnitStyle}>/mes</span>
              </Text>
              <Text style={planFeatureStyle}>Pacientes ilimitados</Text>
              <Text style={planFeatureStyle}>Branding PDF avanzado</Text>
              <Text style={planFeatureStyle}>Soporte prioritario</Text>
            </Section>

            <Section style={ctaContainerStyle}>
              <Button href={pricingUrl} style={buttonStyle}>
                Empezar prueba de 14 días →
              </Button>
            </Section>

            <Text style={subtleTextStyle}>
              14 días de prueba sin tarjeta. Cancela cuando quieras.
            </Text>

            <Hr style={hrStyle} />

            <Text style={textStyle}>
              Si tienes dudas sobre qué plan encaja mejor con tu consulta, responde a este email.
              Leo todos los mensajes personalmente.
            </Text>

            <Text style={signatureStyle}>
              <strong>Rubén</strong>
              <br />
              Fundador de Dietly
            </Text>
          </Section>
        </Container>

        <Section style={unsubscribeStyle}>
          <Text style={unsubscribeTextStyle}>
            ¿No quieres recibir más emails? Escribe a hola@dietly.es y te damos de baja.
          </Text>
        </Section>
      </Body>
    </Html>
  );
}

export default UpsellEmail;

// ── Estilos ───────────────────────────────────────────────────────────────────

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

const planCardStyle: React.CSSProperties = {
  backgroundColor: '#22252f',
  border: '1px solid #2a2d3a',
  borderRadius: '10px',
  padding: '20px 24px',
  margin: '16px 0',
};

const planCardHighlightStyle: React.CSSProperties = {
  backgroundColor: '#22252f',
  border: '1px solid #1a7a45',
  borderRadius: '10px',
  padding: '20px 24px',
  margin: '16px 0',
};

const planBadgeStyle: React.CSSProperties = {
  backgroundColor: '#1a7a45',
  borderRadius: '4px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  margin: '0 0 8px',
  padding: '3px 8px',
};

const planNameStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 4px',
};

const planPriceStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 12px',
};

const planPriceUnitStyle: React.CSSProperties = {
  color: '#8a8fa0',
  fontSize: '14px',
  fontWeight: '400',
};

const planFeatureStyle: React.CSSProperties = {
  color: '#c8cdd8',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 4px',
};

const ctaContainerStyle: React.CSSProperties = {
  margin: '28px 0 8px',
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

const subtleTextStyle: React.CSSProperties = {
  color: '#8a8fa0',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
  textAlign: 'center',
};

const hrStyle: React.CSSProperties = {
  borderColor: '#2a2d3a',
  margin: '24px 0',
};

const signatureStyle: React.CSSProperties = {
  color: '#c8cdd8',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0',
};

const unsubscribeStyle: React.CSSProperties = {
  maxWidth: '520px',
  margin: '32px auto 0',
  padding: '0 16px',
  textAlign: 'center',
};

const unsubscribeTextStyle: React.CSSProperties = {
  color: '#999999',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
};

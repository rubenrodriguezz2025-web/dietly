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

interface PlanReadyEmailProps {
  patientName: string;
  nutritionistName: string;
  clinicName?: string | null;
  planUrl: string;
}

export function PlanReadyEmail({
  patientName,
  nutritionistName,
  clinicName,
  planUrl,
}: PlanReadyEmailProps) {
  const from = clinicName ?? nutritionistName;

  return (
    <Html lang='es'>
      <Head />
      <Preview>
        Tu plan nutricional personalizado está listo – {from}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>dietly</Text>
          </Section>

          {/* Contenido principal */}
          <Section style={contentStyle}>
            <Text style={greetingStyle}>Hola {patientName},</Text>

            <Text style={textStyle}>
              Tu nutricionista <strong>{nutritionistName}</strong> ha preparado y revisado
              tu plan nutricional personalizado. Ya está listo para que puedas consultarlo
              en cualquier momento.
            </Text>

            <Text style={textStyle}>
              El plan incluye tus comidas del día, las calorías y macronutrientes de cada
              una, y la lista de la compra para toda la semana.
            </Text>

            {/* CTA */}
            <Section style={ctaContainerStyle}>
              <Button href={planUrl} style={buttonStyle}>
                Ver mi plan nutricional
              </Button>
            </Section>

            <Text style={tipStyle}>
              💡 Puedes añadir esta página a la pantalla de inicio de tu móvil para
              acceder al plan sin necesidad de buscar el enlace.
            </Text>

            <Hr style={hrStyle} />

            <Text style={footerStyle}>
              Plan preparado por <strong>{nutritionistName}</strong>
              {clinicName ? ` · ${clinicName}` : ''}.
              Si tienes dudas sobre tu plan, contacta directamente con tu nutricionista.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PlanReadyEmail;

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

const tipStyle: React.CSSProperties = {
  color: '#7a8094',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0 0 24px',
  backgroundColor: '#22253a',
  borderRadius: '8px',
  padding: '12px 16px',
};

const hrStyle: React.CSSProperties = {
  borderColor: '#2a2d3a',
  margin: '24px 0',
};

const footerStyle: React.CSSProperties = {
  color: '#7a8094',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
};

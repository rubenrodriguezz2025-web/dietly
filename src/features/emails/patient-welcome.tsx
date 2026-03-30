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

interface PatientWelcomeEmailProps {
  patientName: string;
  nutritionistName: string;
  clinicName?: string | null;
  intakeUrl: string;
}

export function PatientWelcomeEmail({
  patientName,
  nutritionistName,
  clinicName,
  intakeUrl,
}: PatientWelcomeEmailProps) {
  const from = clinicName ?? nutritionistName;

  return (
    <Html lang='es'>
      <Head />
      <Preview>
        {nutritionistName} te ha dado de alta en Dietly — rellena tu cuestionario inicial
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
              <strong>{from}</strong> te ha registrado en Dietly para prepararte un plan
              nutricional personalizado.
            </Text>

            <Text style={textStyle}>
              Para que tu nutricionista pueda diseñar el plan más adecuado para ti, necesitamos
              que rellenes un breve cuestionario sobre tus hábitos, preferencias y objetivos.
              Solo te llevará unos minutos.
            </Text>

            {/* CTA */}
            <Section style={ctaContainerStyle}>
              <Button href={intakeUrl} style={buttonStyle}>
                Rellenar mi cuestionario →
              </Button>
            </Section>

            <Text style={noteStyle}>
              Si el botón no funciona, copia y pega este enlace en tu navegador:
              <br />
              <span style={linkStyle}>{intakeUrl}</span>
            </Text>

            <Hr style={hrStyle} />

            <Text style={footerStyle}>
              Este mensaje ha sido enviado por <strong>{nutritionistName}</strong> a través de
              Dietly. Si tienes cualquier duda sobre tu plan nutricional, contacta directamente
              con tu nutricionista.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PatientWelcomeEmail;

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

const noteStyle: React.CSSProperties = {
  color: '#7a8094',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const linkStyle: React.CSSProperties = {
  color: '#4ade80',
  wordBreak: 'break-all',
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

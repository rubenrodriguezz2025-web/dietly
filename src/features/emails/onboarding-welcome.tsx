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

interface OnboardingWelcomeEmailProps {
  name: string;
  dashboardUrl: string;
}

export function OnboardingWelcomeEmail({ name, dashboardUrl }: OnboardingWelcomeEmailProps) {
  return (
    <Html lang='es'>
      <Head />
      <Preview>Tu cuenta de Dietly está lista — empieza ahora 🌱</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>dietly</Text>
          </Section>

          {/* Contenido */}
          <Section style={contentStyle}>
            <Text style={greetingStyle}>Bienvenida, {name} 🌱</Text>

            <Text style={textStyle}>
              Tu perfil está configurado y Dietly está listo para ahorrarte horas de trabajo.
            </Text>

            <Text style={textStyle}>
              En menos de 5 minutos puedes tener el{' '}
              <strong>primer borrador de plan nutricional</strong> listo para revisar. Solo
              necesitas crear un paciente y pulsar &quot;Generar plan&quot;.
            </Text>

            <Section style={stepsContainerStyle}>
              <Section style={stepStyle}>
                <Text style={stepNumberStyle}>1</Text>
                <Text style={stepTextStyle}>
                  Crea tu primer paciente con sus datos básicos
                </Text>
              </Section>
              <Section style={stepStyle}>
                <Text style={stepNumberStyle}>2</Text>
                <Text style={stepTextStyle}>
                  Pulsa <strong>&quot;Generar plan&quot;</strong> — el borrador estará en 2 minutos
                </Text>
              </Section>
              <Section style={stepStyle}>
                <Text style={stepNumberStyle}>3</Text>
                <Text style={stepTextStyle}>
                  Revísalo, ajústalo y apruébalo con tu firma
                </Text>
              </Section>
              <Section style={stepStyle}>
                <Text style={stepNumberStyle}>4</Text>
                <Text style={stepTextStyle}>
                  Envíaselo al paciente — PDF con tu marca en segundos
                </Text>
              </Section>
            </Section>

            <Section style={ctaContainerStyle}>
              <Button href={dashboardUrl} style={buttonStyle}>
                Ir a mi panel →
              </Button>
            </Section>

            <Hr style={hrStyle} />

            <Text style={textStyle}>
              Si tienes cualquier duda o encuentras algo que mejorar, responde a este email o
              escríbeme directamente. Estoy leyendo todos los mensajes personalmente.
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

export default OnboardingWelcomeEmail;

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

/**
 * libs/ai/alert-email.tsx
 *
 * Plantilla React Email para alertas críticas del sistema de generación IA.
 */

import * as React from 'react';

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type AlertType = 'auth_error' | 'circuit_breaker_open' | 'high_error_rate';

interface AlertEmailProps {
  type:      AlertType;
  details:   Record<string, unknown>;
  timestamp: string;
}

const TYPE_CONFIG: Record<AlertType, { label: string; color: string; description: string }> = {
  auth_error: {
    label:       'Error de autenticación API',
    color:       '#dc2626',
    description: 'La API de Anthropic devolvió un error 400/401. Verifica que ANTHROPIC_API_KEY sea válida y tenga crédito suficiente.',
  },
  circuit_breaker_open: {
    label:       'Circuit breaker abierto',
    color:       '#d97706',
    description: 'Se han producido 5 fallos consecutivos en la generación de planes. Las peticiones están pausadas 60 segundos.',
  },
  high_error_rate: {
    label:       'Tasa de error elevada (>20 %)',
    color:       '#9333ea',
    description: 'Más del 20 % de los planes generados en los últimos 5 minutos han fallado.',
  },
};

export function AlertEmail({ type, details, timestamp }: AlertEmailProps): React.ReactElement {
  const config = TYPE_CONFIG[type];
  const fecha  = new Date(timestamp).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

  return (
    <Html>
      <Head />
      <Preview>[Dietly ALERTA] {config.label}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={{ ...styles.header, borderLeft: `4px solid ${config.color}` }}>
            <Text style={{ ...styles.badge, color: config.color }}>ALERTA DEL SISTEMA</Text>
            <Heading style={styles.heading}>{config.label}</Heading>
            <Text style={styles.timestamp}>{fecha}</Text>
          </Section>

          {/* Descripción */}
          <Section style={styles.section}>
            <Text style={styles.description}>{config.description}</Text>
          </Section>

          <Hr style={styles.hr} />

          {/* Detalles técnicos */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles técnicos</Text>
            <Section style={styles.codeBlock}>
              {Object.entries(details).map(([key, value]) => (
                <Text key={key} style={styles.codeLine}>
                  <span style={styles.codeKey}>{key}:</span>{' '}
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Text>
              ))}
            </Section>
          </Section>

          <Hr style={styles.hr} />

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Dietly · Sistema de alertas automáticas · dietly.es
            </Text>
            <Text style={styles.footerText}>
              Revisa los logs en Vercel o Supabase para más información.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#0f172a',
    fontFamily:      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  container: {
    margin:          '40px auto',
    maxWidth:        '560px',
    padding:         '0 20px',
  },
  header: {
    padding:         '24px',
    backgroundColor: '#1e293b',
    borderRadius:    '8px 8px 0 0',
    marginBottom:    0,
  },
  badge: {
    fontSize:        '10px',
    fontWeight:      '700' as const,
    letterSpacing:   '0.1em',
    textTransform:   'uppercase' as const,
    margin:          '0 0 8px',
  },
  heading: {
    color:           '#f1f5f9',
    fontSize:        '20px',
    fontWeight:      '700' as const,
    margin:          '0 0 8px',
    lineHeight:      '1.3',
  },
  timestamp: {
    color:           '#64748b',
    fontSize:        '13px',
    margin:          0,
  },
  section: {
    padding:         '20px 24px',
    backgroundColor: '#1e293b',
  },
  description: {
    color:           '#94a3b8',
    fontSize:        '14px',
    lineHeight:      '1.6',
    margin:          0,
  },
  sectionTitle: {
    color:           '#64748b',
    fontSize:        '11px',
    fontWeight:      '600' as const,
    textTransform:   'uppercase' as const,
    letterSpacing:   '0.05em',
    margin:          '0 0 12px',
  },
  codeBlock: {
    backgroundColor: '#0f172a',
    borderRadius:    '6px',
    padding:         '12px 16px',
  },
  codeLine: {
    color:           '#e2e8f0',
    fontSize:        '13px',
    fontFamily:      '"Menlo", "Monaco", monospace',
    margin:          '2px 0',
  },
  codeKey: {
    color:           '#7dd3fc',
  },
  hr: {
    borderColor:     '#334155',
    margin:          0,
  },
  footer: {
    padding:         '16px 24px',
    backgroundColor: '#1e293b',
    borderRadius:    '0 0 8px 8px',
  },
  footerText: {
    color:           '#475569',
    fontSize:        '12px',
    margin:          '2px 0',
    textAlign:       'center' as const,
  },
} as const;

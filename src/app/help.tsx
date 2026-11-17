import { router } from 'expo-router';
import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { Section } from '@/components/Section';
import { helpText } from '@/lib/helpText';
import { useI18n } from '@/lib/i18n';

const mono = Platform.select({ ios: 'Menlo', default: 'monospace' });

/** Commands to type on the server; selectable so they can be copied. */
function Commands({ lines }: { lines: string[] }) {
  const theme = useTheme();
  return (
    <View style={[styles.code, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Text selectable style={[styles.mono, { color: theme.colors.onSurfaceVariant }]}>
        {lines.join('\n')}
      </Text>
    </View>
  );
}

export default function Help() {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const h = helpText[lang];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text variant="bodyMedium" style={styles.intro}>
        {h.intro}
      </Text>

      {h.steps.map((s) => (
        <Section key={s.title} title={s.title}>
          <Text variant="bodyMedium">{s.text}</Text>
          {s.commands ? <Commands lines={s.commands} /> : null}
          {s.links?.map((l) => (
            <Text
              key={l.url}
              variant="bodyMedium"
              style={[styles.mono, { color: theme.colors.primary }]}
              onPress={() => Linking.openURL(l.url)}>
              {l.label}
            </Text>
          ))}
          {s.after ? <Text variant="bodyMedium">{s.after}</Text> : null}
          {s.pairButton ? (
            <Button mode="contained-tonal" icon="qrcode-scan" onPress={() => router.push('/pair')}>
              {t('add_server')}
            </Button>
          ) : null}
        </Section>
      ))}

      <Section title={h.troubleTitle}>
        {h.trouble.map((p) => (
          <View key={p.problem} style={styles.trouble}>
            <Text variant="labelLarge">{p.problem}</Text>
            <Text variant="bodyMedium">{p.fix}</Text>
            {p.commands ? <Commands lines={p.commands} /> : null}
          </View>
        ))}
      </Section>

      <Text variant="bodySmall" style={styles.note}>
        {h.note}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  intro: { marginHorizontal: 16, marginTop: 16, opacity: 0.8 },
  code: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  mono: { fontFamily: mono, fontSize: 13, lineHeight: 20 },
  trouble: { gap: 6 },
  note: { marginHorizontal: 16, marginTop: 12, opacity: 0.6 },
});

import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { useI18n } from '@/lib/i18n';

export function Welcome() {
  const { t } = useI18n();
  return (
    <View style={styles.wrap}>
      <Text variant="headlineSmall">{t('welcome_title')}</Text>
      <Text variant="bodyMedium" style={styles.text}>
        {t('welcome_text')}
      </Text>
      <Button mode="contained" icon="qrcode-scan" onPress={() => router.push('/pair')}>
        {t('add_server')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  text: { textAlign: 'center', opacity: 0.8 },
});

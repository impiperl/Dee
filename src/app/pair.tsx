import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { api, ApiError, normalizeUrl } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { usePush } from '@/lib/pushSync';
import { useServers } from '@/lib/servers';

// Known servers, to save typing when entering a code by hand.
const PRESETS = [
  { label: 'Prod', url: 'https://gaistnet.com/mon' },
  { label: 'Dev', url: 'http://192.168.0.115/mon' },
];

/** Content of the QR code printed by "tweedle pair". */
interface PairQR {
  tweedle: number;
  name?: string;
  url: string;
  code: string;
}

function parseQR(data: string): PairQR | null {
  try {
    const v = JSON.parse(data);
    if (v && v.tweedle === 1 && typeof v.url === 'string' && typeof v.code === 'string') return v;
  } catch {
    // not JSON
  }
  return null;
}

export default function Pair() {
  const { t, lang } = useI18n();
  const { add } = useServers();
  const push = usePush();
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [url, setUrl] = useState(PRESETS[0].url);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const lastScan = useRef('');

  const pair = async (rawUrl: string, rawCode: string) => {
    const target = normalizeUrl(rawUrl);
    setBusy(true);
    setError(null);
    try {
      const r = await api.pair(target, {
        code: rawCode.trim(),
        name: Device.deviceName ?? Device.modelName ?? 'Dee',
        lang,
        pushToken: push.token,
      });
      add({ name: r.name, url: target, token: r.token, minLevel: 'warn' });
      router.back();
    } catch (e) {
      const err = e as ApiError;
      setError(err.status === 403 ? t('pair_code_invalid') : t('pair_failed', { error: err.message }));
      lastScan.current = '';
    } finally {
      setBusy(false);
    }
  };

  const onScan = (r: BarcodeScanningResult) => {
    if (busy || r.data === lastScan.current) return;
    lastScan.current = r.data;
    const qr = parseQR(r.data);
    if (!qr) {
      setError(t('pair_not_tweedle'));
      return;
    }
    pair(qr.url, qr.code);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SegmentedButtons
          value={mode}
          onValueChange={(v) => {
            setMode(v as 'scan' | 'manual');
            setError(null);
          }}
          buttons={[
            { value: 'scan', label: t('pair_scan'), icon: 'qrcode-scan' },
            { value: 'manual', label: t('pair_manual'), icon: 'keyboard-outline' },
          ]}
        />

        {mode === 'scan' ? (
          permission?.granted ? (
            <View style={styles.camera}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={busy ? undefined : onScan}
              />
            </View>
          ) : (
            <View style={styles.permission}>
              <Text variant="bodyMedium">{t('pair_camera_needed')}</Text>
              {permission && !permission.canAskAgain ? null : (
                <Button mode="contained" onPress={requestPermission}>
                  {t('pair_camera_allow')}
                </Button>
              )}
            </View>
          )
        ) : (
          <View style={styles.form}>
            <View style={styles.presets}>
              {PRESETS.map((p) => (
                <Chip key={p.label} selected={normalizeUrl(url) === p.url} onPress={() => setUrl(p.url)}>
                  {p.label}
                </Chip>
              ))}
            </View>
            <TextInput
              mode="outlined"
              label={t('pair_url')}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TextInput
              mode="outlined"
              label={t('pair_code')}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="ABCDE-FGHJK"
            />
            <Button
              mode="contained"
              disabled={busy || !url.trim() || code.replace(/[^A-Z0-9]/gi, '').length < 10}
              loading={busy}
              onPress={() => pair(url, code)}>
              {busy ? t('pair_busy') : t('pair_submit')}
            </Button>
          </View>
        )}

        {busy && mode === 'scan' ? <Text style={styles.center}>{t('pair_busy')}</Text> : null}
        {error ? <HelperText type="error">{error}</HelperText> : null}
        <Text variant="bodySmall" style={styles.hint}>
          {t('pair_hint')}
        </Text>
        <Button mode="text" icon="help-circle-outline" onPress={() => router.push('/help')}>
          {t('help_link')}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16 },
  camera: { aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },
  permission: { gap: 12, alignItems: 'center', paddingVertical: 32 },
  form: { gap: 12 },
  presets: { flexDirection: 'row', gap: 8 },
  center: { textAlign: 'center' },
  hint: { opacity: 0.6, textAlign: 'center' },
});

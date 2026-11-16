import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

export function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card mode="contained" style={styles.card}>
      <View style={styles.head}>
        <Text variant="titleSmall">{title}</Text>
        {right}
      </View>
      <View style={styles.body}>{children}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginTop: 12 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 },
});

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { BLOCK_TYPES } from './blocks';
import { BlockId } from '../types';

export type Tool = { mode: 'move' } | { mode: 'erase' } | { mode: 'place'; blockId: BlockId };

interface Props {
  tool: Tool;
  onSelect: (tool: Tool) => void;
}

export default function Palette({ tool, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <ToolButton label="Walk" color="#333333" active={tool.mode === 'move'} onPress={() => onSelect({ mode: 'move' })} />
        <ToolButton label="Erase" color="#888888" active={tool.mode === 'erase'} onPress={() => onSelect({ mode: 'erase' })} />
        {BLOCK_TYPES.map((b) => (
          <ToolButton
            key={b.id}
            label={b.label}
            color={b.color}
            active={tool.mode === 'place' && tool.blockId === b.id}
            onPress={() => onSelect({ mode: 'place', blockId: b.id })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function ToolButton({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, active && styles.buttonActive]}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, backgroundColor: '#1c1c1e' },
  row: { paddingHorizontal: 8, gap: 8 },
  button: { alignItems: 'center', padding: 6, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  buttonActive: { borderColor: '#ffffff' },
  swatch: { width: 28, height: 28, borderRadius: 6, marginBottom: 4 },
  label: { color: '#ffffff', fontSize: 11 },
});

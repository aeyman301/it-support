import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Grid, RemotePlayer } from '../types';
import { BLOCK_COLORS } from './blocks';

interface Props {
  grid: Grid;
  cellSize: number;
  playerRow: number;
  playerCol: number;
  playerColor: string;
  remotePlayers: RemotePlayer[];
  onCellPress: (row: number, col: number) => void;
}

export default function GameGrid({
  grid,
  cellSize,
  playerRow,
  playerCol,
  playerColor,
  remotePlayers,
  onCellPress,
}: Props) {
  return (
    <View style={styles.container}>
      {grid.map((rowArr, r) => (
        <View key={r} style={styles.row}>
          {rowArr.map((block, c) => (
            <TouchableOpacity
              key={c}
              activeOpacity={0.7}
              onPress={() => onCellPress(r, c)}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: block ? BLOCK_COLORS[block] : '#EAF3E4',
                },
              ]}
            />
          ))}
        </View>
      ))}

      <PlayerMarker row={playerRow} col={playerCol} size={cellSize} color={playerColor} label="You" />
      {remotePlayers.map((p) => (
        <PlayerMarker key={p.id} row={p.row} col={p.col} size={cellSize} color={p.color} label={p.name} />
      ))}
    </View>
  );
}

function PlayerMarker({
  row,
  col,
  size,
  color,
}: {
  row: number;
  col: number;
  size: number;
  color: string;
  label: string;
}) {
  return (
    <View
      pointerEvents="none"
      style={[styles.player, { width: size, height: size, left: col * size, top: row * size }]}
    >
      <View style={[styles.playerDot, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', alignSelf: 'center' },
  row: { flexDirection: 'row' },
  cell: { borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  player: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  playerDot: {
    width: '55%',
    height: '55%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#fff',
  },
});

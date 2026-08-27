import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { BlockId, RemotePlayer, World } from '../types';
import { loadWorld, saveWorld, exportWorld } from '../storage/worldStorage';
import GameGrid from '../game/GameGrid';
import Palette, { Tool } from '../game/Palette';
import { CoopClient } from '../net/coopClient';

interface Props {
  worldId: string;
  onBack: () => void;
}

const SELF_COLOR = '#F2B705';

export default function WorldScreen({ worldId, onBack }: Props) {
  const [world, setWorld] = useState<World | null>(null);
  const [tool, setTool] = useState<Tool>({ mode: 'move' });
  const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 });
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const [showCoopPanel, setShowCoopPanel] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('Player');
  const [connected, setConnected] = useState(false);

  const coopRef = useRef<CoopClient | null>(null);

  useEffect(() => {
    loadWorld(worldId).then(setWorld);
    return () => {
      coopRef.current?.disconnect();
    };
  }, [worldId]);

  const cellSize = useMemo(() => {
    if (!world) return 24;
    const screenWidth = Dimensions.get('window').width - 24;
    return Math.floor(screenWidth / world.cols);
  }, [world]);

  const applyBlockChange = (row: number, col: number, blockId: BlockId | null) => {
    setWorld((prev) => {
      if (!prev) return prev;
      const grid = prev.grid.map((r) => r.slice());
      grid[row][col] = blockId;
      return { ...prev, grid };
    });
  };

  const handleCellPress = (row: number, col: number) => {
    if (!world) return;
    if (tool.mode === 'move') {
      setPlayerPos({ row, col });
      coopRef.current?.sendMove(row, col);
      return;
    }
    const blockId = tool.mode === 'erase' ? null : tool.blockId;
    applyBlockChange(row, col, blockId);
    coopRef.current?.sendBlockEdit(row, col, blockId);
  };

  const handleSave = async () => {
    if (!world) return;
    const saved = await saveWorld(world);
    setWorld(saved);
    Alert.alert('Saved', `"${saved.name}" was saved.`);
  };

  const handleShare = async () => {
    if (!world) return;
    try {
      await Share.share({ message: exportWorld(world), title: world.name });
    } catch {
      // user cancelled the share sheet; nothing to do
    }
  };

  const handleConnect = () => {
    if (!world || !roomCode.trim()) {
      Alert.alert('Room code required', 'Enter a room code to host or join a co-op session.');
      return;
    }
    coopRef.current?.disconnect();
    const client = new CoopClient(serverUrl.trim(), roomCode.trim(), playerName.trim() || 'Player', world, {
      onWorldState: (state) => {
        setWorld(state);
        setConnected(true);
      },
      onPlayers: (players) => {
        const selfId = client.selfId;
        setRemotePlayers(players.filter((p) => p.id !== selfId));
      },
      onBlockEdit: (row, col, blockId) => {
        applyBlockChange(row, col, blockId);
      },
      onConnectError: (message) => {
        setConnected(false);
        Alert.alert('Connection failed', message);
      },
    });
    coopRef.current = client;
    setShowCoopPanel(false);
  };

  const handleDisconnect = () => {
    coopRef.current?.disconnect();
    coopRef.current = null;
    setConnected(false);
    setRemotePlayers([]);
  };

  if (!world) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>Loading world…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.headerButton}>‹ Worlds</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {world.name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.headerButton}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Text style={styles.headerButton}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => (connected ? handleDisconnect() : setShowCoopPanel((s) => !s))}>
            <Text style={[styles.headerButton, connected && styles.headerButtonActive]}>
              {connected ? 'Online' : 'Co-op'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showCoopPanel && !connected && (
        <View style={styles.coopPanel}>
          <TextInput
            style={styles.coopInput}
            placeholder="Server URL"
            placeholderTextColor="#888"
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.coopInput}
            placeholder="Room code"
            placeholderTextColor="#888"
            value={roomCode}
            onChangeText={setRoomCode}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.coopInput}
            placeholder="Your name"
            placeholderTextColor="#888"
            value={playerName}
            onChangeText={setPlayerName}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleConnect}>
            <Text style={styles.primaryButtonText}>Connect</Text>
          </TouchableOpacity>
        </View>
      )}

      {connected && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            Room "{roomCode}" · {remotePlayers.length} other player{remotePlayers.length === 1 ? '' : 's'} online
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.gridScroll}>
        <GameGrid
          grid={world.grid}
          cellSize={cellSize}
          playerRow={playerPos.row}
          playerCol={playerPos.col}
          playerColor={SELF_COLOR}
          remotePlayers={remotePlayers}
          onCellPress={handleCellPress}
        />
      </ScrollView>

      <Palette tool={tool} onSelect={setTool} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111214' },
  loading: { color: '#fff', textAlign: 'center', marginTop: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1, marginHorizontal: 8 },
  headerActions: { flexDirection: 'row', gap: 14 },
  headerButton: { color: '#4C8DFF', fontSize: 13 },
  headerButtonActive: { color: '#4CD964' },
  coopPanel: { padding: 12, gap: 8, backgroundColor: '#1c1c1e' },
  coopInput: {
    backgroundColor: '#2a2a2c',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryButton: { backgroundColor: '#4C8DFF', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  statusBar: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#173d2b' },
  statusText: { color: '#7CFFA0', fontSize: 12 },
  gridScroll: { padding: 12, alignItems: 'center' },
});

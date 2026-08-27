import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { WorldSummary } from '../types';
import { createWorld, deleteWorld, importWorld, listWorlds } from '../storage/worldStorage';

interface Props {
  onOpenWorld: (worldId: string) => void;
}

export default function HomeScreen({ onOpenWorld }: Props) {
  const [worlds, setWorlds] = useState<WorldSummary[]>([]);
  const [newName, setNewName] = useState('');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const refresh = useCallback(() => {
    listWorlds().then(setWorlds);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async () => {
    const name = newName.trim() || 'New World';
    const world = await createWorld(name);
    setNewName('');
    refresh();
    onOpenWorld(world.id);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete world', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWorld(id);
          refresh();
        },
      },
    ]);
  };

  const handleImport = async () => {
    try {
      const world = await importWorld(importText.trim());
      setImportText('');
      setShowImport(false);
      refresh();
      onOpenWorld(world.id);
    } catch (e) {
      Alert.alert('Import failed', e instanceof Error ? e.message : 'Invalid world data');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Sandbox Builder</Text>
        <Text style={styles.subtitle}>Build worlds. Save them. Share them. Build together.</Text>

        <View style={styles.createRow}>
          <TextInput
            style={styles.input}
            placeholder="World name"
            placeholderTextColor="#888"
            value={newName}
            onChangeText={setNewName}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleCreate}>
            <Text style={styles.primaryButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.linkButton} onPress={() => setShowImport((s) => !s)}>
          <Text style={styles.linkButtonText}>{showImport ? 'Cancel import' : 'Import a shared world'}</Text>
        </TouchableOpacity>

        {showImport && (
          <View style={styles.importBox}>
            <TextInput
              style={styles.importInput}
              placeholder="Paste world JSON here"
              placeholderTextColor="#888"
              value={importText}
              onChangeText={setImportText}
              multiline
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleImport}>
              <Text style={styles.primaryButtonText}>Import</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          style={styles.list}
          data={worlds}
          keyExtractor={(w) => w.id}
          ListEmptyComponent={<Text style={styles.empty}>No worlds yet. Create one above to get started.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.worldRow} onPress={() => onOpenWorld(item.id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.worldName}>{item.name}</Text>
                <Text style={styles.worldMeta}>Updated {new Date(item.updatedAt).toLocaleString()}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111214' },
  container: { flex: 1, padding: 16 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#9aa0a6', fontSize: 13, marginTop: 4, marginBottom: 16 },
  createRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#4C8DFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  linkButton: { marginBottom: 8 },
  linkButtonText: { color: '#4C8DFF', fontSize: 13 },
  importBox: { marginBottom: 12, gap: 8 },
  importInput: {
    backgroundColor: '#1c1c1e',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  list: { flex: 1, marginTop: 8 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
  worldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  worldName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  worldMeta: { color: '#9aa0a6', fontSize: 12, marginTop: 2 },
  deleteButton: { paddingHorizontal: 10, paddingVertical: 6 },
  deleteButtonText: { color: '#E5534B', fontSize: 12 },
});

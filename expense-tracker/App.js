import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button, FlatList, TouchableOpacity, Modal, Pressable } from 'react-native';

const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Other'];

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [date, setDate] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editIdx, setEditIdx] = useState(null);

  const resetForm = () => {
    setDesc(''); setAmount(''); setCategory(categories[0]); setDate(''); setEditIdx(null);
  };

  const addOrEditExpense = () => {
    if (!desc || !amount || !date) return;
    const newExpense = { desc, amount: parseFloat(amount), category, date };
    if (editIdx !== null) {
      const updated = [...expenses];
      updated[editIdx] = newExpense;
      setExpenses(updated);
    } else {
      setExpenses([...expenses, newExpense]);
    }
    resetForm();
    setModalVisible(false);
  };

  const deleteExpense = idx => {
    setExpenses(expenses.filter((_, i) => i !== idx));
  };

  const startEdit = idx => {
    const exp = expenses[idx];
    setDesc(exp.desc);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setDate(exp.date);
    setEditIdx(idx);
    setModalVisible(true);
  };

  const filteredExpenses = expenses.filter(exp =>
    (filterCat === 'All' || exp.category === filterCat) &&
    (!filterDate || exp.date === filterDate)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expense Tracker</Text>
      <View style={styles.filterRow}>
        <Text>Category:</Text>
        <FlatList
          horizontal
          data={['All', ...categories]}
          renderItem={({ item }) => (
            <Pressable onPress={() => setFilterCat(item)} style={[styles.catBtn, filterCat === item && styles.catBtnActive]}>
              <Text>{item}</Text>
            </Pressable>
          )}
          keyExtractor={item => item}
        />
      </View>
      <View style={styles.filterRow}>
        <Text>Date:</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={filterDate}
          onChangeText={setFilterDate}
        />
        <Button title="Clear" onPress={() => setFilterDate('')} />
      </View>
      <FlatList
        data={filteredExpenses}
        keyExtractor={(_, idx) => idx.toString()}
        ListEmptyComponent={<Text style={{ textAlign: 'center', margin: 20 }}>No expenses found.</Text>}
        renderItem={({ item, index }) => (
          <View style={styles.expenseItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.expenseDesc}>{item.desc}</Text>
              <Text>{item.category} | {item.date}</Text>
            </View>
            <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
            <TouchableOpacity onPress={() => startEdit(index)} style={styles.editBtn}><Text>Edit</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => deleteExpense(index)} style={styles.deleteBtn}><Text>Delete</Text></TouchableOpacity>
          </View>
        )}
      />
      <Button title="Add Expense" onPress={() => { resetForm(); setModalVisible(true); }} />
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editIdx !== null ? 'Edit' : 'Add'} Expense</Text>
            <TextInput style={styles.input} placeholder="Description" value={desc} onChangeText={setDesc} />
            <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
            <View style={styles.catRow}>
              {categories.map(cat => (
                <Pressable key={cat} onPress={() => setCategory(cat)} style={[styles.catBtn, category === cat && styles.catBtnActive]}>
                  <Text>{cat}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => { setModalVisible(false); resetForm(); }} />
              <Button title={editIdx !== null ? 'Save' : 'Add'} onPress={addOrEditExpense} />
            </View>
          </View>
        </View>
      </Modal>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', paddingTop: 50, paddingHorizontal: 10 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catBtn: { padding: 6, marginHorizontal: 2, borderRadius: 8, backgroundColor: '#eee' },
  catBtnActive: { backgroundColor: '#cde' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, margin: 4, flex: 1 },
  expenseItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginVertical: 4, padding: 10, borderRadius: 8, elevation: 2 },
  expenseDesc: { fontWeight: 'bold', fontSize: 16 },
  expenseAmount: { fontWeight: 'bold', color: '#2196f3', marginHorizontal: 8 },
  editBtn: { backgroundColor: '#ffd700', padding: 6, borderRadius: 6, marginHorizontal: 2 },
  deleteBtn: { backgroundColor: '#ff5252', padding: 6, borderRadius: 6, marginHorizontal: 2 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});

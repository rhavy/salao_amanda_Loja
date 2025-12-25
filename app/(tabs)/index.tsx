import { ThemedView } from "@/components/themed-view";
import { auth, db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeInUp, LinearTransition } from "react-native-reanimated";
import { toast } from "sonner-native";

export default function AdminFinanceScreen() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Estados para Meta Mensal
  const [monthlyGoal, setMonthlyGoal] = useState(5000);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState("");

  // Estados para o Filtro de Mês/Ano
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  useEffect(() => {
    // 1. Buscar a meta salva no banco de dados
    const fetchSettings = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().monthlyGoal) {
          setMonthlyGoal(userDoc.data().monthlyGoal);
        }
      }
    };

    // 2. Escutar agendamentos
    const q = query(collection(db, "appointments"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().date?.toDate()
      }));
      setAppointments(data);
      setLoading(false);
    });

    fetchSettings();
    return () => unsubscribe();
  }, []);

  // 💾 Salvar nova meta no Firestore
  const handleSaveGoal = async () => {
    const goalValue = parseFloat(newGoalInput);
    if (isNaN(goalValue) || goalValue <= 0) {
      toast.error("Insira um valor válido!");
      return;
    }

    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          monthlyGoal: goalValue
        });
        setMonthlyGoal(goalValue);
        setIsModalVisible(false);
        toast.success("Meta atualizada!");
      }
    } catch (e) {
      toast.error("Erro ao salvar meta.");
    }
  };

  // 📊 Lógica Financeira Filtrada
  const finance = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
    const calculateTotal = (list: any[]) => list.reduce((acc, curr) => acc + (curr.price || 0), 0);

    const monthApps = appointments.filter(a => a.date >= start && a.date <= end);
    const finished = monthApps.filter(a => a.status === 'finished');
    const projections = monthApps.filter(a => a.status === 'confirmed');

    const realIncome = calculateTotal(finished);
    const progress = Math.min((realIncome / monthlyGoal) * 100, 100);

    return {
      real: realIncome,
      projection: calculateTotal(projections),
      count: finished.length,
      progress,
      totalYear: calculateTotal(appointments.filter(a => a.status === 'finished' && a.date.getFullYear() === selectedYear))
    };
  }, [appointments, selectedMonth, selectedYear, monthlyGoal]);

  const changeMonth = (direction: 'next' | 'prev') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(prev => prev - 1); }
      else { setSelectedMonth(prev => prev - 1); }
    } else {
      if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(prev => prev + 1); }
      else { setSelectedMonth(prev => prev + 1); }
    }
  };

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-gray-50">
      <ActivityIndicator size="large" color="#ec4899" />
    </View>
  );

  return (
    <ThemedView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header com Seletor de Mês */}
        <View className="bg-pink-500 p-8 pt-16 rounded-b-[50px] shadow-xl">
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity onPress={() => changeMonth('prev')} className="bg-white/20 p-2 rounded-full">
              <Ionicons name="chevron-back" size={20} color="white" />
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-white font-bold text-lg">{months[selectedMonth]}</Text>
              <Text className="text-white/70 text-xs">{selectedYear}</Text>
            </View>

            <TouchableOpacity onPress={() => changeMonth('next')} className="bg-white/20 p-2 rounded-full">
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInUp} className="items-center">
            <Text className="text-white/70 font-bold uppercase text-[10px] tracking-widest mb-1">Faturamento Mensal (Realizado)</Text>
            <Text className="text-5xl font-bold text-white mb-6">R$ {finance.real.toFixed(2)}</Text>
          </Animated.View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-white/10 p-4 rounded-3xl border border-white/20">
              <Text className="text-white/60 text-[9px] font-bold uppercase">Projeção Mês</Text>
              <Text className="text-white text-lg font-bold">R$ {finance.projection.toFixed(2)}</Text>
            </View>
            <View className="flex-1 bg-white/10 p-4 rounded-3xl border border-white/20">
              <Text className="text-white/60 text-[9px] font-bold uppercase">Acumulado Ano</Text>
              <Text className="text-white text-lg font-bold">R$ {finance.totalYear.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        {/* Resumo de Atividade */}
        <View className="p-6">
          <Text className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-4 ml-2">Análise do Mês</Text>

          <View className="flex-row justify-between mb-4">
            <View className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 w-[48%] items-center">
              <Ionicons name="people" size={24} color="#ec4899" />
              <Text className="text-2xl font-bold text-gray-800 mt-2">{finance.count}</Text>
              <Text className="text-gray-400 text-[10px] font-bold text-center">CLIENTES ATENDIDOS</Text>
            </View>

            <View className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 w-[48%] items-center">
              <Ionicons name="cash" size={24} color="#10b981" />
              <Text className="text-2xl font-bold text-gray-800 mt-2">
                R$ {(finance.real / (finance.count || 1)).toFixed(0)}
              </Text>
              <Text className="text-gray-400 text-[10px] font-bold">TICKET MÉDIO</Text>
            </View>
          </View>

          {/* Meta Visual Editável */}
          <View className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-gray-800 font-bold">Progresso da Meta</Text>
                <Text className="text-[10px] text-gray-400">Meta: R$ {monthlyGoal.toLocaleString('pt-BR')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => { setNewGoalInput(monthlyGoal.toString()); setIsModalVisible(true) }}
                className="bg-pink-50 p-2 rounded-full"
              >
                <Ionicons name="pencil" size={16} color="#ec4899" />
              </TouchableOpacity>
            </View>

            <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <Animated.View
                layout={LinearTransition}
                className="h-full bg-pink-500"
                style={{ width: `${finance.progress}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-400 text-[9px]">Status: {finance.count > 0 ? 'Em andamento' : 'Sem dados'}</Text>
              <Text className="text-pink-600 font-bold text-[10px]">{finance.progress.toFixed(1)}%</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal para Alterar Meta */}
      <Modal visible={isModalVisible} animationType="fade" transparent>
        <View className="flex-1 justify-center bg-black/60 p-6">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View className="bg-white p-8 rounded-[40px] shadow-2xl">
              <Text className="text-xl font-bold text-gray-800 mb-2">Ajustar Meta Mensal</Text>
              <Text className="text-gray-400 text-xs mb-6">Qual o seu objetivo de faturamento para este mês?</Text>

              <View className="bg-gray-100 flex-row items-center p-4 rounded-2xl mb-6 border border-gray-200">
                <Text className="text-gray-500 font-bold mr-2">R$</Text>
                <TextInput
                  className="flex-1 font-bold text-lg text-gray-800"
                  keyboardType="numeric"
                  value={newGoalInput}
                  onChangeText={setNewGoalInput}
                  placeholder="Ex: 5000"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                onPress={handleSaveGoal}
                className="bg-pink-500 p-4 rounded-2xl items-center shadow-lg active:bg-pink-600"
              >
                <Text className="text-white font-bold text-lg">Salvar Configuração</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsModalVisible(false)} className="mt-4 items-center">
                <Text className="text-gray-400 font-medium">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}
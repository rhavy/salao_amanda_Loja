import { ThemedView } from "@/components/themed-view";
import { db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import MaskInput, { createNumberMask } from "react-native-mask-input";
import Animated, { FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";
import { toast } from "sonner-native";

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

const brlMask = createNumberMask({
  prefix: ["R", "$", " "],
  delimiter: ".",
  separator: ",",
  precision: 2,
});

export default function AdminServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Estados do Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];
      setServices(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 📈 Estatísticas e Filtro de Busca
  const filteredServices = useMemo(() => {
    return services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [services, searchQuery]);

  const stats = useMemo(() => {
    const total = services.length;
    const avgPrice = total > 0 ? services.reduce((acc, s) => acc + s.price, 0) / total : 0;
    return { total, avgPrice };
  }, [services]);

  const parseCurrency = (value: string) => Number(value.replace(/\D/g, "")) / 100;

  const openModal = (service?: Service) => {
    if (service) {
      setEditingId(service.id);
      setName(service.name);
      setPrice((service.price * 100).toString());
      setDuration(service.duration.toString());
    } else {
      setEditingId(null);
      setName("");
      setPrice("");
      setDuration("");
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || !price || !duration) {
      toast.error("Preencha todos os campos!");
      return;
    }
    setIsSaving(true);
    const data = { name, price: parseCurrency(price), duration: Number(duration) };

    try {
      if (editingId) await updateDoc(doc(db, "services", editingId), data);
      else await addDoc(collection(db, "services"), data);
      toast.success(editingId ? "Serviço atualizado!" : "Serviço criado!");
      setModalVisible(false);
    } catch (e) {
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem: ListRenderItem<Service> = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50)}
      exiting={FadeOut}
      layout={LinearTransition}
      className="mx-4 mb-3 rounded-3xl bg-white p-4 shadow-sm flex-row items-center border border-gray-100"
    >
      <View className="flex-1">
        <Text className="text-gray-900 font-bold text-base">{item.name}</Text>
        <View className="flex-row items-center mt-1">
          <View className={`px-2 py-0.5 rounded-md ${item.duration > 60 ? 'bg-orange-50' : 'bg-blue-50'}`}>
            <Text className={`text-[10px] font-bold ${item.duration > 60 ? 'text-orange-600' : 'text-blue-600'}`}>
              ⏱ {item.duration} MIN
            </Text>
          </View>
          <Text className="text-gray-300 mx-2">|</Text>
          <Text className="text-pink-600 font-black text-sm">R$ {item.price.toFixed(2).replace('.', ',')}</Text>
        </View>
      </View>

      <View className="flex-row">
        <TouchableOpacity onPress={() => openModal(item)} className="bg-blue-50 p-3 rounded-2xl mr-2">
          <Ionicons name="pencil" size={18} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Alert.alert("Excluir", `Apagar ${item.name}?`, [
            { text: "Não" },
            { text: "Sim", style: 'destructive', onPress: () => deleteDoc(doc(db, "services", item.id)) }
          ])}
          className="bg-red-50 p-3 rounded-2xl"
        >
          <Ionicons name="trash" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <ThemedView className="flex-1 bg-gray-50">
      <View className="bg-pink-500 p-6 pt-16 rounded-b-[45px] shadow-xl">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white/70 font-bold uppercase text-[10px] tracking-widest">Configurações</Text>
            <Text className="text-3xl font-bold text-white">Serviços</Text>
          </View>
          <View className="bg-white/20 p-2 rounded-2xl">
            <Ionicons name="cut-outline" size={24} color="white" />
          </View>
        </View>

        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white/10 p-4 rounded-3xl border border-white/20">
            <Text className="text-white/60 text-[9px] font-bold uppercase">Cadastrados</Text>
            <Text className="text-white text-xl font-bold mt-1">{stats.total}</Text>
          </View>
          <View className="flex-1 bg-white/10 p-4 rounded-3xl border border-white/20">
            <Text className="text-white/60 text-[9px] font-bold uppercase">Ticket Médio</Text>
            <Text className="text-white text-xl font-bold mt-1">R$ {stats.avgPrice.toFixed(0)}</Text>
          </View>
        </View>

        {/* 🔍 Barra de Busca Integrada */}
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-2 shadow-sm">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Buscar serviço..."
            className="flex-1 ml-2 h-10 font-medium text-gray-700"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="flex-1 mt-4">
        {loading ? (
          <ActivityIndicator size="large" color="#ec4899" className="mt-20" />
        ) : (
          <FlashList
            data={filteredServices}
            renderItem={renderItem}
            estimatedItemSize={100}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <View className="items-center mt-20 opacity-30">
                <Ionicons name="search-outline" size={64} />
                <Text className="font-bold mt-2">Nenhum serviço encontrado</Text>
              </View>
            }
          />
        )}
      </View>

      <TouchableOpacity
        onPress={() => openModal()}
        className="absolute bottom-8 right-8 w-16 h-16 bg-pink-600 rounded-full items-center justify-center shadow-2xl"
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View className="bg-white rounded-t-[50px] p-8">
              <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-6" />
              <Text className="text-2xl font-bold mb-6 text-gray-800">
                {editingId ? "Editar Detalhes" : "Novo Serviço"}
              </Text>

              <Text className="text-[10px] font-bold text-gray-400 mb-2 uppercase ml-1">Descrição</Text>
              <TextInput
                className="bg-gray-50 border border-gray-100 p-4 rounded-2xl mb-4 text-gray-800 font-medium"
                value={name}
                onChangeText={setName}
                placeholder="Ex: Corte e Barba"
              />

              <View className="flex-row justify-between mb-8">
                <View className="w-[48%]">
                  <Text className="text-[10px] font-bold text-gray-400 mb-2 uppercase ml-1">Valor</Text>
                  <MaskInput
                    className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-gray-800 font-medium"
                    value={price}
                    onChangeText={setPrice}
                    mask={brlMask}
                    keyboardType="numeric"
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="text-[10px] font-bold text-gray-400 mb-2 uppercase ml-1">Tempo (Min)</Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-gray-800 font-medium"
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                    placeholder="60"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                className={`h-16 rounded-3xl items-center justify-center shadow-lg ${isSaving ? 'bg-gray-300' : 'bg-pink-500'}`}
              >
                {isSaving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Salvar Alterações</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setModalVisible(false)} className="mt-4 p-4 items-center">
                <Text className="text-gray-400 font-bold">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}
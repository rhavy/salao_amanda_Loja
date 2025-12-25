import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { auth, db } from "@/config/firebase"; // Importe o auth aqui
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // Importe o router
import { signOut } from "firebase/auth"; // Importe o signOut
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import MaskInput, { Masks } from "react-native-mask-input";
import Animated, { FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";
import { toast } from "sonner-native";

interface BusinessHour {
  day: string;
  open: string;
  close: string;
}

const DAYS_OF_WEEK = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo", "Feriados"];
const TIME_MASK = [/\d/, /\d/, ':', /\d/, /\d/];

export default function AdminLocationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [whatsapp, setWhatsapp] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "salon_info"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWhatsapp(data.whatsapp || "");
        setStreet(data.street || "");
        setNumber(data.number || "");
        setNeighborhood(data.neighborhood || "");
        setCity(data.city || "");
        setBusinessHours(data.businessHours || []);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- FUNÇÃO PARA SAIR ---
  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/login"); // Certifique-se que o caminho do seu login está correto
          } catch (error) {
            toast.error("Erro ao sair.");
          }
        }
      },
    ]);
  };

  const addHourRow = () => {
    if (businessHours.length >= DAYS_OF_WEEK.length) return;
    setBusinessHours([...businessHours, { day: "Segunda", open: "09:00", close: "18:00" }]);
  };

  const updateHourRow = (index: number, field: keyof BusinessHour, value: string) => {
    const newHours = [...businessHours];
    newHours[index][field] = value;
    setBusinessHours(newHours);
  };

  const handleConfirmSave = () => {
    if (!street || !whatsapp || !city) {
      toast.error("Preencha os campos obrigatórios!");
      return;
    }

    Alert.alert(
      "Publicar Alterações",
      "As informações de contato e horários serão atualizadas para todos os clientes imediatamente. Confirmar?",
      [
        { text: "Revisar", style: "cancel" },
        { text: "Sim, Publicar", onPress: saveToFirestore }
      ]
    );
  };

  const saveToFirestore = async () => {
    setIsSaving(true);
    try {
      const salonData = {
        whatsapp,
        street,
        number,
        neighborhood,
        city,
        address: `${street}, ${number} - ${neighborhood}, ${city}`,
        businessHours,
        lastUpdate: new Date().toISOString()
      };

      await setDoc(doc(db, "settings", "salon_info"), salonData, { merge: true });
      toast.success("Dados publicados!");
    } catch (e) {
      toast.error("Erro técnico ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator color="#ec4899" /></View>;

  return (
    <ThemedView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown} className="bg-pink-500 p-8 pt-16 rounded-b-[45px] shadow-xl mb-8 flex-row justify-between items-center">
            <View>
              <ThemedText className="text-white opacity-80 mb-1 font-medium uppercase text-[10px] tracking-widest">Painel Amanda</ThemedText>
              <ThemedText className="text-3xl font-bold text-white">Dados do Salão</ThemedText>
            </View>

            {/* BOTÃO SAIR NO TOPO */}
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-white/20 p-3 rounded-2xl border border-white/20"
            >
              <Ionicons name="log-out-outline" size={24} color="white" />
            </TouchableOpacity>
          </Animated.View>

          <View className="px-6">

            {/* Seção Endereço */}
            <View className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100 mb-6">
              <Text className="text-gray-400 font-bold text-[10px] uppercase mb-4 tracking-widest">Localização</Text>
              <TextInput placeholder="Rua/Av" className="bg-gray-50 p-4 rounded-2xl mb-3 border border-gray-100 font-medium" value={street} onChangeText={setStreet} />
              <View className="flex-row mb-3">
                <TextInput placeholder="Nº" keyboardType="numeric" className="flex-1 bg-gray-50 p-4 rounded-2xl mr-2 border border-gray-100 font-medium" value={number} onChangeText={setNumber} />
                <TextInput placeholder="Bairro" className="flex-[2] bg-gray-50 p-4 rounded-2xl border border-gray-100 font-medium" value={neighborhood} onChangeText={setNeighborhood} />
              </View>
              <TextInput placeholder="Cidade - UF" className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-medium" value={city} onChangeText={setCity} />
            </View>

            {/* Seção Comunicação */}
            <View className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100 mb-6">
              <Text className="text-gray-400 font-bold text-[10px] uppercase mb-4 tracking-widest">WhatsApp de Contato</Text>
              <MaskInput
                value={whatsapp}
                onChangeText={(masked) => setWhatsapp(masked)}
                mask={Masks.BRL_PHONE}
                keyboardType="phone-pad"
                className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-medium"
                placeholder="(00) 00000-0000"
              />
            </View>

            {/* Seção Horários */}
            <View className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100 mb-8">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Horários</Text>
                <TouchableOpacity onPress={addHourRow} className="bg-pink-50 px-4 py-2 rounded-full border border-pink-100">
                  <Text className="text-pink-600 font-bold text-[10px]">ADICIONAR DIA</Text>
                </TouchableOpacity>
              </View>

              {businessHours.map((item, index) => (
                <Animated.View key={index} entering={FadeInDown} exiting={FadeOut} layout={LinearTransition} className="mb-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center flex-1">
                      <Ionicons name="calendar-outline" size={14} color="#ec4899" />
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="ml-2">
                        {DAYS_OF_WEEK.map(d => (
                          <TouchableOpacity key={d} onPress={() => updateHourRow(index, 'day', d)} className={`px-3 py-1 rounded-full mr-2 ${item.day === d ? 'bg-pink-500' : 'bg-white border border-gray-200'}`}>
                            <Text className={`text-[9px] font-bold ${item.day === d ? 'text-white' : 'text-gray-400'}`}>{d}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    <TouchableOpacity onPress={() => setBusinessHours(businessHours.filter((_, i) => i !== index))} className="ml-2">
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row items-center justify-between mt-1">
                    <View className="flex-row items-center bg-white px-3 py-2 rounded-xl border border-gray-100 w-[45%]">
                      <Text className="text-[10px] text-gray-400 mr-2">ABRE</Text>
                      <MaskInput value={item.open} mask={TIME_MASK} onChangeText={(val) => updateHourRow(index, 'open', val)} keyboardType="numeric" className="font-bold text-gray-700" />
                    </View>
                    <Ionicons name="arrow-forward" size={12} color="#D1D5DB" />
                    <View className="flex-row items-center bg-white px-3 py-2 rounded-xl border border-gray-100 w-[45%]">
                      <Text className="text-[10px] text-gray-400 mr-2">FECHA</Text>
                      <MaskInput value={item.close} mask={TIME_MASK} onChangeText={(val) => updateHourRow(index, 'close', val)} keyboardType="numeric" className="font-bold text-gray-700" />
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleConfirmSave}
              disabled={isSaving}
              className={`h-16 rounded-[25px] items-center justify-center shadow-lg ${isSaving ? 'bg-gray-300' : 'bg-pink-600'}`}
            >
              {isSaving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Publicar Dados</Text>}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
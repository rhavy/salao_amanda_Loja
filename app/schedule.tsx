import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { auth, db } from "@/config/firebase"; // Importando config do Firebase
import { BUSINESS_HOURS } from "@/constants/data";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc, Timestamp } from "firebase/firestore"; // Firestore
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { toast } from "sonner-native";

// --- Funções Auxiliares de Data ---
const getNextDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  return days;
};

const getTimeSlots = (date: Date) => {
  const dayOfWeek = date.getDay();
  let hours;
  if (dayOfWeek === 0) hours = BUSINESS_HOURS.sunday;
  else if (dayOfWeek === 6) hours = BUSINESS_HOURS.saturday;
  else hours = BUSINESS_HOURS.weekdays;

  if (!hours.open || !hours.close) return [];

  const slots = [];
  let [startHour] = hours.open.split(":").map(Number);
  const [endHour] = hours.close.split(":").map(Number);
  let currentHour = startHour;
  while (currentHour < endHour) {
    slots.push(`${currentHour.toString().padStart(2, "0")}:00`);
    currentHour++;
  }
  return slots;
};

export default function ScheduleScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams();

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // 🚀 BUSCAR DADOS DO SERVIÇO NO FIREBASE
  useEffect(() => {
    async function fetchService() {
      try {
        const docRef = doc(db, "services", serviceId as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Erro", { description: "Serviço não encontrado." });
          router.back();
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchService();
  }, [serviceId]);

  const days = useMemo(() => getNextDays(), []);
  const timeSlots = useMemo(() => getTimeSlots(selectedDate), [selectedDate]);

  // 🚀 SALVAR AGENDAMENTO NO FIREBASE
  const handleSchedule = async () => {
    const user = auth.currentUser;

    if (!user) {
      toast.error("Erro", { description: "Você precisa estar logado." });
      return;
    }

    // Criar objeto de data completa para o Firestore
    const [hours, minutes] = selectedTime!.split(":").map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    Alert.alert(
      "Confirmar",
      `Agendar ${service.name} para ${selectedDate.toLocaleDateString("pt-BR")} às ${selectedTime}?`,
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, Confirmar",
          onPress: async () => {
            setScheduling(true);
            try {
              await addDoc(collection(db, "appointments"), {
                userId: user.uid,
                userName: user.displayName,
                serviceId: service.id,
                serviceName: service.name,
                price: service.price,
                professional: "Equipe Amanda", // Pode ser dinâmico no futuro
                date: Timestamp.fromDate(appointmentDate),
                status: "pending", // Inicia como pendente
                createdAt: Timestamp.now(),
              });

              toast.success("Sucesso!", { description: "Agendamento realizado!" });
              router.replace("/(tabs)/appointments");
            } catch (error) {
              toast.error("Erro", { description: "Não foi possível agendar." });
            } finally {
              setScheduling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#ec4899" />
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        <Animated.View entering={FadeInDown.duration(800).springify()} className="bg-pink-500 p-6 pt-12 rounded-b-3xl shadow-md">
          <TouchableOpacity onPress={() => router.back()} className="mb-4 w-10">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <Text className="text-white opacity-80 mb-1 font-medium">Agendar Serviço</Text>
          <Text className="text-3xl font-bold text-white">{service.name}</Text>

          <View className="flex-row items-center mt-3">
            <View className="bg-white/20 px-3 py-1 rounded-full mr-3">
              <Text className="text-white font-semibold">
                R$ {service.price.toFixed(2).replace(".", ",")}
              </Text>
            </View>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white font-semibold">{service.duration} min</Text>
            </View>
          </View>
        </Animated.View>

        <View className="p-4">
          <Animated.View entering={FadeInDown.delay(200).duration(800)}>
            <ThemedText type="subtitle" className="mb-3 mt-2 text-gray-800">Escolha a Data</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              {days.map((date, index) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isSunday = date.getDay() === 0;
                return (
                  <TouchableOpacity
                    key={index}
                    disabled={isSunday}
                    onPress={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                    className={`mr-3 items-center justify-center rounded-2xl p-4 w-20 border ${isSelected ? "bg-pink-500 border-pink-500" : isSunday ? "bg-gray-100 border-gray-200 opacity-50" : "bg-white border-gray-200"}`}
                  >
                    <Text className={`text-xs uppercase mb-1 ${isSelected ? "text-pink-100" : "text-gray-400"}`}>
                      {date.toLocaleDateString("pt-BR", { weekday: "short" }).replace('.', '')}
                    </Text>
                    <Text className={`text-xl font-bold ${isSelected ? "text-white" : "text-gray-800"}`}>
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)}>
            <ThemedText type="subtitle" className="mb-3 text-gray-800">Horários Disponíveis</ThemedText>
            {timeSlots.length > 0 ? (
              <View className="flex-row flex-wrap justify-between">
                {timeSlots.map((time, index) => {
                  const isSelected = time === selectedTime;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedTime(time)}
                      className={`mb-3 w-[31%] items-center rounded-xl border py-3 ${isSelected ? "bg-pink-500 border-pink-500" : "bg-white border-gray-200"}`}
                    >
                      <Text className={`font-semibold ${isSelected ? "text-white" : "text-gray-600"}`}>{time}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View className="p-6 bg-white rounded-xl items-center border border-gray-100">
                <Text className="text-gray-400">Não abrimos neste dia.</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      <Animated.View entering={FadeInDown.delay(600).duration(800)} className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 shadow-lg">
        <TouchableOpacity
          className={`w-full h-14 items-center justify-center rounded-xl ${selectedTime && !scheduling ? "bg-pink-600 active:bg-pink-700" : "bg-gray-200"}`}
          disabled={!selectedTime || scheduling}
          onPress={handleSchedule}
        >
          {scheduling ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`font-bold text-lg ${selectedTime ? "text-white" : "text-gray-400"}`}>
              Confirmar Agendamento
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </ThemedView>
  );
}
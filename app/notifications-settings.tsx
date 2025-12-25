import { ThemedView } from "@/components/themed-view";
import { auth, db } from "@/config/firebase"; // Importando sua config
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Firestore métodos
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { toast } from "sonner-native";

export default function NotificationsSettingsScreen() {
    const router = useRouter();

    // Estados para os toggles
    const [reminders, setReminders] = useState(true);
    const [promotions, setPromotions] = useState(false);
    const [marketing, setMarketing] = useState(true);
    const [loading, setLoading] = useState(true);

    // 🚀 1. Carregar preferências do Firebase ao abrir a tela
    useEffect(() => {
        async function loadPreferences() {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data()?.notifications || {};
                    // Se não existir o campo no banco, ele assume o valor padrão definido no useState
                    if (data.reminders !== undefined) setReminders(data.reminders);
                    if (data.promotions !== undefined) setPromotions(data.promotions);
                    if (data.marketing !== undefined) setMarketing(data.marketing);
                }
            } catch (error) {
                console.error("Erro ao carregar preferências:", error);
            } finally {
                setLoading(false);
            }
        }
        loadPreferences();
    }, []);

    // 🚀 2. Salvar alteração no Firebase em tempo real
    const toggleSwitch = async (
        field: "reminders" | "promotions" | "marketing",
        value: boolean,
        setter: (v: boolean) => void
    ) => {
        const user = auth.currentUser;
        if (!user) return;

        // Atualização otimista (muda na tela antes de ir pro banco para ser instantâneo)
        setter(value);

        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                [`notifications.${field}`]: value // Atualiza o campo aninhado sem apagar os outros
            });

            const status = value ? "ativadas" : "desativadas";
            toast.success("Sucesso", {
                description: `Preferências atualizadas.`
            });
        } catch (error) {
            // Reverte em caso de erro
            setter(!value);
            toast.error("Erro ao salvar", {
                description: "Não foi possível sincronizar com o servidor."
            });
        }
    };

    const SettingItem = ({ icon, title, subtitle, value, onValueChange }: any) => (
        <View className="flex-row items-center bg-white p-4 mb-4 rounded-2xl border border-gray-100 shadow-sm">
            <View className="h-10 w-10 rounded-full bg-pink-50 items-center justify-center mr-4">
                <Ionicons name={icon} size={22} color="#ec4899" />
            </View>
            <View className="flex-1">
                <Text className="font-bold text-gray-800 text-base">{title}</Text>
                <Text className="text-gray-400 text-xs">{subtitle}</Text>
            </View>
            <Switch
                trackColor={{ false: "#fee2e2", true: "#fbcfe8" }}
                thumbColor={value ? "#ec4899" : "#f4f4f5"}
                ios_backgroundColor="#f4f4f5"
                onValueChange={onValueChange}
                value={value}
            />
        </View>
    );

    if (loading) {
        return (
            <ThemedView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#ec4899" />
            </ThemedView>
        );
    }

    return (
        <ThemedView className="flex-1 bg-gray-50">
            <ScrollView showsVerticalScrollIndicator={false}>

                <Animated.View
                    entering={FadeInDown.duration(800).springify()}
                    className="bg-pink-500 p-6 pt-12 rounded-b-[40px] shadow-md mb-6"
                >
                    <TouchableOpacity onPress={() => router.back()} className="mb-4 w-10">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white opacity-80 mb-1 font-medium">Preferências</Text>
                    <Text className="text-3xl font-bold text-white">Notificações</Text>
                </Animated.View>

                <View className="p-6">
                    <Animated.View entering={FadeInDown.delay(200).duration(800)}>

                        <Text className="text-gray-400 font-bold mb-4 uppercase text-[10px] tracking-widest ml-1">
                            Como deseja ser avisado?
                        </Text>

                        <SettingItem
                            icon="alarm-outline"
                            title="Lembretes de Horário"
                            subtitle="Avisar 1 hora antes do seu agendamento"
                            value={reminders}
                            onValueChange={(v: boolean) => toggleSwitch("reminders", v, setReminders)}
                        />

                        <SettingItem
                            icon="pricetag-outline"
                            title="Promoções e Ofertas"
                            subtitle="Novos cupons e descontos exclusivos"
                            value={promotions}
                            onValueChange={(v: boolean) => toggleSwitch("promotions", v, setPromotions)}
                        />

                        <SettingItem
                            icon="chatbubbles-outline"
                            title="Mensagens da Amanda"
                            subtitle="Novidades e atualizações do salão"
                            value={marketing}
                            onValueChange={(v: boolean) => toggleSwitch("marketing", v, setMarketing)}
                        />

                        <View className="mt-6 bg-pink-50 p-4 rounded-2xl border border-pink-100">
                            <View className="flex-row items-start">
                                <Ionicons name="information-circle" size={20} color="#ec4899" />
                                <Text className="flex-1 ml-2 text-pink-700 text-xs leading-5">
                                    Recomendamos manter os <Text className="font-bold">Lembretes de Horário</Text> ativos para você não perder sua vaga e evitar taxas de cancelamento.
                                </Text>
                            </View>
                        </View>

                    </Animated.View>
                </View>
            </ScrollView>
        </ThemedView>
    );
}
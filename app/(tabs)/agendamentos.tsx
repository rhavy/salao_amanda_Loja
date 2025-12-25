import { ThemedView } from "@/components/themed-view";
import { db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity, View
} from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { toast } from "sonner-native";

type FilterType = 'all' | 'pending' | 'today' | 'confirmed' | 'finished';

export default function AdminPanelScreen() {
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState("");

    // 1. Monitorar Agendamentos em Tempo Real
    useEffect(() => {
        const qApp = query(collection(db, "appointments"), orderBy("date", "desc"));
        const unsubApp = onSnapshot(qApp, (snap) => {
            setAppointments(snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                date: d.data().date?.toDate()
            })));
            setLoading(false);
        });
        return () => unsubApp();
    }, []);

    // 2. Lógica Financeira e Contadores
    const stats = useMemo(() => {
        const todayStr = new Date().toDateString();
        const attended = appointments.filter(a => a.status === 'finished');

        return {
            total: attended.reduce((acc, curr) => acc + (curr.price || 0), 0),
            pendingCount: appointments.filter(a => a.status === 'pending').length,
            confirmedCount: appointments.filter(a => a.status === 'confirmed').length,
            finishedCount: appointments.filter(a => a.status === 'finished').length,
            todayCount: appointments.filter(a => a.date?.toDateString() === todayStr).length,
            allCount: appointments.length
        };
    }, [appointments]);

    // 3. Lógica Combinada: Filtro de Status + Busca por Texto
    const filteredAppointments = useMemo(() => {
        return appointments.filter(a => {
            // Filtro de Status/Data
            const matchesStatus = () => {
                if (filterStatus === 'all') return true;
                if (filterStatus === 'today') return a.date?.toDateString() === new Date().toDateString();
                return a.status === filterStatus;
            };

            // Filtro de Busca (Nome do Cliente ou Serviço)
            const matchesSearch =
                a.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.serviceName?.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesStatus() && matchesSearch;
        });
    }, [appointments, filterStatus, searchQuery]);

    // 4. Notificar Cliente via Push
    const notifyClient = async (userId: string, title: string, body: string) => {
        try {
            const userSnap = await getDoc(doc(db, "users", userId));
            const pushToken = userSnap.data()?.pushToken;
            if (pushToken) {
                await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: pushToken, title, body, data: { screen: 'appointments' } }),
                });
            }
        } catch (e) { console.error("Erro ao notificar:", e); }
    };

    // 5. Atualizar Status
    const handleUpdateStatus = async (item: any, newStatus: string) => {
        const update = async () => {
            try {
                await updateDoc(doc(db, "appointments", item.id), { status: newStatus });
                if (newStatus === 'confirmed') {
                    toast.success("Horário Confirmado!");
                    await notifyClient(item.userId, "Confirmado! ✅", `Seu horário para ${item.serviceName} foi aprovado.`);
                } else {
                    toast.success(`Status: ${newStatus.toUpperCase()}`);
                }
            } catch (e) { toast.error("Erro ao atualizar"); }
        };

        if (newStatus === 'finished') {
            Alert.alert("Finalizar Atendimento", "Confirmar atendimento realizado? O valor entrará no faturamento.", [
                { text: "Cancelar", style: "cancel" },
                { text: "Confirmar", onPress: update }
            ]);
        } else {
            update();
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert("Excluir", "Remover permanentemente?", [
            { text: "Não" },
            { text: "Sim", style: "destructive", onPress: () => deleteDoc(doc(db, "appointments", id)) }
        ]);
    };

    const renderAppointment = ({ item }: { item: any }) => {
        const theme = {
            pending: { color: "text-orange-600", bg: "bg-orange-50", dot: "bg-orange-400" },
            confirmed: { color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-400" },
            finished: { color: "text-green-600", bg: "bg-green-50", dot: "bg-green-500" },
        };
        const currentTheme = theme[item.status as keyof typeof theme] || theme.pending;

        return (
            <Animated.View entering={FadeInDown} layout={LinearTransition}
                className={`mx-4 mb-3 bg-white rounded-3xl p-4 shadow-sm border border-gray-100 ${item.status === 'finished' ? 'opacity-70' : ''}`}>
                <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                            <View className={`w-2 h-2 rounded-full mr-2 ${currentTheme.dot}`} />
                            <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.userName || 'Cliente'}</Text>
                        </View>
                        <Text className="text-lg font-bold text-gray-800">{item.serviceName}</Text>
                        <Text className="text-xs text-gray-500 mt-1">{item.date?.toLocaleString('pt-BR')} • R$ {item.price?.toFixed(2)}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-md ${currentTheme.bg}`}>
                        <Text className={`text-[8px] font-bold ${currentTheme.color}`}>{item.status?.toUpperCase()}</Text>
                    </View>
                </View>

                <View className="mt-4 pt-4 border-t border-gray-50 flex-row justify-between items-center">
                    <View className="flex-row gap-2">
                        <TouchableOpacity onPress={() => handleUpdateStatus(item, 'pending')}
                            className={`p-2.5 rounded-xl border ${item.status === 'pending' ? 'bg-orange-500 border-orange-500' : 'border-gray-100'}`}>
                            <Ionicons name="time" size={16} color={item.status === 'pending' ? "white" : "#9CA3AF"} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleUpdateStatus(item, 'confirmed')}
                            className={`p-2.5 rounded-xl border ${item.status === 'confirmed' ? 'bg-blue-500 border-blue-500' : 'border-gray-100'}`}>
                            <Ionicons name="calendar" size={16} color={item.status === 'confirmed' ? "white" : "#9CA3AF"} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleUpdateStatus(item, 'finished')}
                            className={`p-2.5 rounded-xl border ${item.status === 'finished' ? 'bg-green-600 border-green-600' : 'border-gray-100'}`}>
                            <Ionicons name="cash" size={16} color={item.status === 'finished' ? "white" : "#9CA3AF"} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} className="bg-red-50 p-2.5 rounded-xl">
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };

    const FilterBtn = ({ type, label, count, colorClass }: { type: FilterType, label: string, count: number, colorClass: string }) => (
        <TouchableOpacity
            onPress={() => setFilterStatus(type)}
            className={`px-5 py-2.5 rounded-full flex-row items-center ${filterStatus === type ? colorClass : 'bg-white border border-gray-100'}`}
        >
            <Text className={`text-[10px] font-bold ${filterStatus === type ? 'text-white' : 'text-gray-500'}`}>{label}</Text>
            {count > 0 && (
                <View className={`ml-2 px-1.5 rounded-full ${filterStatus === type ? 'bg-white/20' : 'bg-gray-100'}`}>
                    <Text className={`text-[9px] font-bold ${filterStatus === type ? 'text-white' : 'text-gray-400'}`}>{count}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <ThemedView className="flex-1 bg-gray-50">
            {/* Header com Faturamento e Busca */}
            <View className="bg-pink-500 p-6 pt-16 rounded-b-[45px] shadow-xl">
                <Text className="text-white/70 font-bold uppercase text-[10px] tracking-widest">Faturamento Recebido</Text>
                <Text className="text-4xl font-bold text-white mb-6">R$ {stats.total.toFixed(2)}</Text>

                {/* 🔍 Barra de Busca */}
                <View className="flex-row items-center bg-white/20 rounded-2xl px-4 py-2 mb-6">
                    <Ionicons name="search" size={18} color="white" />
                    <TextInput
                        className="flex-1 ml-2 text-white font-medium"
                        placeholder="Buscar cliente ou serviço..."
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View className="flex-row gap-2">
                    <View className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/20"><Text className="text-white/60 text-[8px] font-bold uppercase">Confirmados</Text><Text className="text-white text-base font-bold">{stats.confirmedCount}</Text></View>
                    <View className="flex-1 bg-white/10 p-3 rounded-2xl border border-white/20"><Text className="text-white/60 text-[8px] font-bold uppercase">Pendentes</Text><Text className="text-white text-base font-bold">{stats.pendingCount}</Text></View>
                    <View className="flex-1 bg-white/20 p-3 rounded-2xl border border-white/30"><Text className="text-white/60 text-[8px] font-bold uppercase">Agenda Hoje</Text><Text className="text-white text-base font-bold">{stats.todayCount}</Text></View>
                </View>
            </View>

            {/* Carrossel de Filtros */}
            <View className="mt-6">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
                    <FilterBtn type="all" label="TODOS" count={stats.allCount} colorClass="bg-gray-800" />
                    <FilterBtn type="today" label="HOJE" count={stats.todayCount} colorClass="bg-pink-600" />
                    <FilterBtn type="pending" label="PENDENTES" count={stats.pendingCount} colorClass="bg-orange-500" />
                    <FilterBtn type="confirmed" label="CONFIRMADOS" count={stats.confirmedCount} colorClass="bg-blue-500" />
                    <FilterBtn type="finished" label="ATENDIDOS" count={stats.finishedCount} colorClass="bg-green-600" />
                </ScrollView>
            </View>

            <View className="flex-1 mt-4">
                {loading ? <ActivityIndicator size="large" color="#ec4899" className="mt-20" /> :
                    <FlashList
                        data={filteredAppointments}
                        renderItem={renderAppointment}
                        estimatedItemSize={150}
                        contentContainerStyle={{ paddingBottom: 50 }}
                        ListEmptyComponent={
                            <View className="items-center mt-20 opacity-30">
                                <Ionicons name="search-outline" size={60} color="#000" />
                                <Text className="font-bold mt-2">Nenhum resultado encontrado</Text>
                            </View>
                        }
                    />}
            </View>
        </ThemedView>
    );
}
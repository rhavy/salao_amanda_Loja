import { ThemedView } from "@/components/themed-view";
import { db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator, Alert,
    KeyboardAvoidingView,
    Modal,
    Platform, ScrollView,
    Text, TextInput,
    TouchableOpacity, View
} from "react-native";
import MaskInput, { createNumberMask } from "react-native-mask-input";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { toast } from "sonner-native";

export interface Service {
    id?: string;
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
    const [modalVisible, setModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Estados do Formulário (Modal)
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

    const parseCurrency = (value: string) => Number(value.replace(/\D/g, "")) / 100;

    const openModal = (service?: Service) => {
        if (service) {
            setEditingId(service.id!);
            setName(service.name);
            setPrice((service.price * 100).toString()); // Ajuste para a máscara
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
        const serviceData = {
            name,
            price: parseCurrency(price),
            duration: Number(duration),
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, "services", editingId), serviceData);
                toast.success("Serviço atualizado!");
            } else {
                await addDoc(collection(db, "services"), serviceData);
                toast.success("Novo serviço adicionado!");
            }
            setModalVisible(false);
        } catch (e) {
            toast.error("Erro ao salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert("Excluir", `Apagar "${name}"?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Apagar", style: "destructive", onPress: () => deleteDoc(doc(db, "services", id)) }
        ]);
    };

    const renderItem: ListRenderItem<Service> = ({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 50)} exiting={FadeOut} className="mx-4 mb-3 rounded-2xl bg-white p-4 shadow-sm flex-row items-center border border-gray-100">
            <View className="flex-1">
                <Text className="text-gray-900 font-bold text-base">{item.name}</Text>
                <Text className="text-pink-600 text-xs font-semibold">R$ {item.price.toFixed(2)} • {item.duration} min</Text>
            </View>
            <View className="flex-row">
                <TouchableOpacity onPress={() => openModal(item)} className="bg-blue-50 p-2.5 rounded-full mr-2">
                    <Ionicons name="pencil" size={18} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id!, item.name)} className="bg-red-50 p-2.5 rounded-full">
                    <Ionicons name="trash" size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <ThemedView className="flex-1 bg-gray-50">
            <FlashList
                data={services}
                renderItem={renderItem}
                estimatedItemSize={80}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListHeaderComponent={
                    <View className="bg-pink-500 p-6 pt-16 rounded-b-[40px] mb-6 shadow-md">
                        <Text className="text-white/80 font-medium">Administração</Text>
                        <Text className="text-3xl font-bold text-white">Serviços</Text>
                    </View>
                }
            />

            <TouchableOpacity
                onPress={() => openModal()}
                className="absolute bottom-8 right-8 w-16 h-16 bg-pink-600 rounded-full items-center justify-center shadow-xl"
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>

            {/* MODAL DE EDIÇÃO / ADIÇÃO */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View className="flex-1 justify-end bg-black/50">
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                        <View className="bg-white rounded-t-[40px] p-8">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-2xl font-bold text-gray-800">
                                    {editingId ? "Editar Serviço" : "Novo Serviço"}
                                </Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close-circle" size={30} color="#D1D5DB" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text className="text-gray-400 font-bold text-[10px] uppercase mb-2 ml-1">Nome</Text>
                                <TextInput className="bg-gray-100 p-4 rounded-2xl mb-4 font-medium" value={name} onChangeText={setName} placeholder="Ex: Progressiva" />

                                <View className="flex-row justify-between">
                                    <View className="w-[48%]">
                                        <Text className="text-gray-400 font-bold text-[10px] uppercase mb-2 ml-1">Preço</Text>
                                        <MaskInput className="bg-gray-100 p-4 rounded-2xl mb-4 font-medium" value={price} onChangeText={setPrice} mask={brlMask} keyboardType="numeric" />
                                    </View>
                                    <View className="w-[48%]">
                                        <Text className="text-gray-400 font-bold text-[10px] uppercase mb-2 ml-1">Duração (min)</Text>
                                        <TextInput className="bg-gray-100 p-4 rounded-2xl mb-4 font-medium" value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="60" />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={handleSave}
                                    disabled={isSaving}
                                    className={`h-16 rounded-2xl items-center justify-center mt-4 ${isSaving ? 'bg-gray-300' : 'bg-pink-500'}`}
                                >
                                    {isSaving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Salvar Alterações</Text>}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </ThemedView>
    );
}
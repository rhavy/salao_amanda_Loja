import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import React, { useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

// Lista de serviços padrão para o Salão Amanda
const DEFAULT_SERVICES = [
    { name: "Corte Feminino", price: 80.0, duration: 60 },
    { name: "Corte Masculino", price: 50.0, duration: 30 },
    { name: "Escova Progressiva", price: 250.0, duration: 180 },
    { name: "Manicure & Pedicure", price: 60.0, duration: 90 },
    { name: "Hidratação Capilar", price: 120.0, duration: 45 },
    { name: "Coloração Completa", price: 180.0, duration: 120 },
    { name: "Design de Sobrancelhas", price: 35.0, duration: 20 },
];

export default function AdminSetupScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const seedDatabase = async () => {
        setLoading(true);
        try {
            const servicesRef = collection(db, "services");
            const snapshot = await getDocs(servicesRef);

            // Evita duplicar se já houver dados
            if (!snapshot.empty) {
                toast.info("Banco já populado", {
                    description: "Os serviços já existem no banco de dados.",
                });
                setLoading(false);
                return;
            }

            // Usamos um 'Batch' para enviar tudo de uma vez (mais eficiente)
            const batch = writeBatch(db);

            DEFAULT_SERVICES.forEach((service) => {
                const newDocRef = doc(servicesRef); // Gera um ID automático
                batch.set(newDocRef, service);
            });

            await batch.commit();

            toast.success("Sucesso!", {
                description: "Todos os serviços foram adicionados ao Firebase.",
            });
            router.replace("/(tabs)");

        } catch (error) {
            console.error(error);
            toast.error("Erro", { description: "Falha ao sincronizar com o banco." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView className="flex-1 items-center justify-center p-6 bg-white">
            <View className="bg-pink-50 p-6 rounded-full mb-6">
                <Ionicons name="cloud-upload-outline" size={80} color="#ec4899" />
            </View>

            <ThemedText type="title" className="text-center mb-2">
                Configuração Inicial
            </ThemedText>

            <ThemedText className="text-gray-500 text-center mb-8">
                Clique no botão abaixo para cadastrar automaticamente os serviços base no seu banco de dados Firebase.
            </ThemedText>

            <TouchableOpacity
                onPress={seedDatabase}
                disabled={loading}
                className={`w-full h-16 rounded-2xl items-center justify-center shadow-lg ${loading ? "bg-pink-300" : "bg-pink-500"
                    }`}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <ThemedText className="text-white font-bold text-lg">
                        Sincronizar Serviços
                    </ThemedText>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.back()}
                className="mt-6"
            >
                <ThemedText className="text-gray-400 font-medium">Voltar</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    );
}
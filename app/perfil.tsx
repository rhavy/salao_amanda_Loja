import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { auth, db, storage } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { toast } from "sonner-native";

interface UserProfile {
    name: string;
    email: string;
    avatar?: string;
    appointmentsCount?: number;
    memberSince?: string;
}

// ✅ Função de formatação ajustada para melhor legibilidade
const formatMemberDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        // Retorna ex: "jan 2024"
        const formatted = date.toLocaleDateString("pt-BR", {
            month: "short",
            year: "numeric",
        }).replace('.', '');

        return formatted;
    } catch (e) {
        return "N/A";
    }
};

export default function ProfileScreen() {
    const router = useRouter();

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    const [isAdmin, setIsAdmin] = useState(true); // Placeholder for admin check

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                await fetchUserProfile(user.uid);
            } else {
                setCurrentUser(null);
                setProfileData(null);
                setLoadingData(false);
                router.replace("/login");
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchUserProfile = async (uid: string) => {
        setLoadingData(true);
        try {
            const userDocRef = doc(db, "users", uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                setProfileData(userData as UserProfile);
                // Simple admin check example
                if (userData.role === 'admin') {
                    setIsAdmin(true);
                }
            } else {
                // Caso o doc não exista no Firestore, usa dados básicos do Auth
                setProfileData({
                    name: auth.currentUser?.displayName || "Usuário",
                    email: auth.currentUser?.email || "",
                    appointmentsCount: 0,
                    memberSince: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error("Erro ao buscar dados do perfil:", error);
            toast.error("Erro", { description: "Não foi possível carregar os dados." });
        } finally {
            setLoadingData(false);
        }
    };

    const handlePickImage = async () => {
        if (!currentUser) return;

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            toast.error("Permissão negada", { description: "Precisamos de acesso às suas fotos." });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            uploadImageToWeb(result.assets[0].uri);
        }
    };

    const uploadImageToWeb = async (fileUri: string) => {
        if (!currentUser) return;

        setUploading(true);
        try {
            const response = await fetch(fileUri);
            const blob = await response.blob();

            const storageRef = ref(storage, `avatars/${currentUser.uid}.jpg`);
            await uploadBytes(storageRef, blob);

            const downloadUrl = await getDownloadURL(storageRef);

            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, { avatar: downloadUrl });

            setProfileData(prev => prev ? { ...prev, avatar: downloadUrl } : null);

            toast.success("Sucesso!", { description: "Foto de perfil atualizada." });
        } catch (error) {
            toast.error("Erro", { description: "Falha ao salvar imagem." });
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert("Sair", "Deseja realmente sair da sua conta?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Sair",
                style: "destructive",
                onPress: async () => {
                    await signOut(auth);
                    toast.success("Até logo!");
                }
            },
        ]);
    };

    const MenuItem = ({ icon, title, subtitle, onPress, isDestructive = false }: any) => (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center bg-white p-4 mb-3 rounded-2xl border border-gray-100 active:bg-gray-50 shadow-sm"
        >
            <View className={`h-10 w-10 rounded-full items-center justify-center ${isDestructive ? 'bg-red-50' : 'bg-pink-50'}`}>
                <Ionicons name={icon} size={20} color={isDestructive ? "#ef4444" : "#ec4899"} />
            </View>
            <View className="flex-1 ml-4">
                <ThemedText className={`font-bold text-base ${isDestructive ? 'text-red-500' : 'text-gray-800'}`}>{title}</ThemedText>
                {subtitle && <ThemedText className="text-gray-400 text-xs">{subtitle}</ThemedText>}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </TouchableOpacity>
    );

    if (loadingData) {
        return (
            <ThemedView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#ec4899" />
            </ThemedView>
        );
    }

    return (
        <ThemedView className="flex-1 bg-gray-50">
            <ScrollView showsVerticalScrollIndicator={false}>

                <Animated.View
                    entering={FadeInDown.duration(800).springify()}
                    className="bg-pink-500 pt-16 pb-10 items-center rounded-b-[40px] shadow-lg"
                >
                    <View className="relative">
                        <View className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden bg-gray-200">
                            {uploading ? (
                                <View className="flex-1 items-center justify-center">
                                    <ActivityIndicator color="#ec4899" />
                                </View>
                            ) : (
                                <Image
                                    source={{ uri: profileData?.avatar || "https://via.placeholder.com/150" }}
                                    className="w-full h-full"
                                />
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={handlePickImage}
                            disabled={uploading}
                            className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md active:bg-gray-100"
                        >
                            <Ionicons name="camera" size={16} color="#ec4899" />
                        </TouchableOpacity>
                    </View>

                    {/* ✅ Nome exibido com tratamento de Fallback */}
                    <ThemedText className="text-white text-2xl font-bold mt-4">
                        {profileData?.name?.split(' ')[0] || "Usuário"}
                    </ThemedText>
                    <ThemedText className="text-pink-100 opacity-80">{profileData?.email}</ThemedText>

                    <View className="flex-row mt-6 w-[80%] bg-white/10 rounded-2xl p-4">
                        <View className="flex-1 items-center border-r border-white/20">
                            <ThemedText className="text-white font-bold text-lg">{profileData?.appointmentsCount || 0}</ThemedText>
                            <ThemedText className="text-pink-100 text-[10px] uppercase">Visitas</ThemedText>
                        </View>
                        <View className="flex-1 items-center">
                            {/* ✅ Data formatada aplicada aqui */}
                            <ThemedText className="text-white font-bold text-lg capitalize">
                                {formatMemberDate(profileData?.memberSince)}
                            </ThemedText>
                            <ThemedText className="text-pink-100 text-[10px] uppercase">Cliente desde</ThemedText>
                        </View>
                    </View>
                </Animated.View>

                <View className="p-6">
                    <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                        <ThemedText className="text-gray-400 font-bold mb-3 uppercase text-xs tracking-widest ml-1">Conta</ThemedText>

                        <MenuItem
                            icon="person-outline"
                            title="Dados Pessoais"
                            subtitle="Nome, telefone e e-mail"
                            onPress={() => router.push("/edit-profile")}
                        />
                        <MenuItem
                            icon="notifications-outline"
                            title="Notificações"
                            subtitle="Lembretes de agendamento"
                            onPress={() => router.push("/notifications-settings")}
                        />
                        <MenuItem
                            icon="lock-closed-outline"
                            title="Segurança"
                            subtitle="Alterar minha senha"
                            onPress={() => router.push("/security-settings")}
                        />
                        <MenuItem
                            icon="help-circle-outline"
                            title="Ajuda & Suporte"
                            subtitle="Veja nosso endereço e contato"
                            onPress={() => router.push("/localizacao")}
                        />

                        {isAdmin && (
                            <>
                                <ThemedText className="text-gray-400 font-bold mt-4 mb-3 uppercase text-xs tracking-widest ml-1">Admin</ThemedText>
                                <MenuItem
                                    icon="settings-outline"
                                    title="Administração"
                                    subtitle="Gerenciar serviços e horários"
                                    onPress={() => router.push("/config_admin")}
                                />
                            </>
                        )}


                        <View className="mt-4">
                            <MenuItem
                                icon="log-out-outline"
                                title="Sair da Conta"
                                onPress={handleLogout}
                                isDestructive={true}
                            />
                        </View>
                    </Animated.View>

                    <ThemedText className="text-center text-gray-300 text-xs mt-6 mb-10">Versão 1.0.0 - Salão Amanda Loja</ThemedText>
                </View>

            </ScrollView>
        </ThemedView>
    );
}
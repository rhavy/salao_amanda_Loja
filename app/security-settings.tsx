import { ThemedView } from "@/components/themed-view";
import { auth } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    DimensionValue,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { toast } from "sonner-native";

export default function SecuritySettingsScreen() {
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    // 🛡️ Lógica de Força da Senha com Tipagem Correta
    const passwordStrength = useMemo(() => {
        if (newPassword.length === 0)
            return { label: "", color: "bg-gray-200", width: "0%" as DimensionValue };
        if (newPassword.length < 6)
            return { label: "Fraca", color: "bg-red-400", width: "33%" as DimensionValue };
        if (newPassword.length < 10)
            return { label: "Média", color: "bg-yellow-400", width: "66%" as DimensionValue };

        return { label: "Forte ✨", color: "bg-green-500", width: "100%" as DimensionValue };
    }, [newPassword]);

    const handleUpdatePassword = async () => {
        const user = auth.currentUser;
        if (!user?.email) return;

        if (newPassword !== confirmPassword) {
            toast.error("Senhas não coincidem");
            return;
        }

        setLoading(true);
        try {
            // Reautenticação necessária pelo Firebase para operações sensíveis
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            await updatePassword(user, newPassword);

            toast.success("Segurança atualizada!", {
                description: "Sua senha foi alterada com sucesso."
            });
            router.back();
        } catch (error: any) {
            console.error(error);
            let msg = "Erro ao atualizar senha.";
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                msg = "A senha atual está incorreta.";
            }
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const PasswordInput = ({ label, value, onChange, placeholder }: any) => (
        <View className="mb-4">
            <Text className="text-gray-400 font-bold mb-2 ml-1 uppercase text-[10px] tracking-widest">
                {label}
            </Text>
            <View className="flex-row items-center bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <Ionicons name="lock-closed" size={20} color="#ec4899" />
                <TextInput
                    className="flex-1 ml-3 text-gray-800 font-medium"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showPass}
                    placeholder={placeholder}
                    placeholderTextColor="#D1D5DB"
                    autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ThemedView className="flex-1 bg-gray-50">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                >
                    <ScrollView showsVerticalScrollIndicator={false}>

                        <Animated.View
                            entering={FadeInDown.duration(800).springify()}
                            className="bg-pink-500 p-6 pt-12 rounded-b-[40px] shadow-md mb-6"
                        >
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="mb-4 w-10 h-10 items-center justify-center rounded-full bg-white/20"
                            >
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                            <Text className="text-white opacity-80 mb-1 font-medium">Privacidade</Text>
                            <Text className="text-3xl font-bold text-white">Segurança</Text>
                        </Animated.View>

                        <View className="p-6">
                            <PasswordInput
                                label="Senha Atual"
                                value={currentPassword}
                                onChange={setCurrentPassword}
                                placeholder="Digite sua senha atual"
                            />

                            <View className="my-4 h-[1px] bg-gray-200" />

                            <PasswordInput
                                label="Nova Senha"
                                value={newPassword}
                                onChange={setNewPassword}
                                placeholder="Mínimo 6 caracteres"
                            />

                            {/* Barra de Força da Senha */}
                            {newPassword.length > 0 && (
                                <Animated.View layout={LinearTransition} className="mb-6 px-1">
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="text-[10px] text-gray-400 uppercase font-bold">
                                            Força da Senha
                                        </Text>
                                        <Text className={`text-[10px] font-bold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                                            {passwordStrength.label}
                                        </Text>
                                    </View>
                                    <View className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                        {/* ✅ Correção do Style com DimensionValue aplicada aqui */}
                                        <View
                                            style={{ width: passwordStrength.width }}
                                            className={`h-full ${passwordStrength.color}`}
                                        />
                                    </View>
                                </Animated.View>
                            )}

                            <PasswordInput
                                label="Confirmar Nova Senha"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                placeholder="Repita a nova senha"
                            />

                            {newPassword !== confirmPassword && confirmPassword.length > 0 && (
                                <Text className="text-red-400 text-[10px] ml-1 mb-4 font-bold italic">
                                    As senhas não coincidem
                                </Text>
                            )}

                            <TouchableOpacity
                                className={`h-16 w-full items-center justify-center rounded-2xl shadow-lg mt-4 ${(loading || newPassword !== confirmPassword || newPassword.length < 6)
                                        ? 'bg-gray-300'
                                        : 'bg-pink-500 active:bg-pink-600'
                                    }`}
                                onPress={handleUpdatePassword}
                                disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-lg font-bold text-white">Salvar Nova Senha</Text>
                                )}
                            </TouchableOpacity>

                            <View className="mt-8 p-5 bg-white rounded-3xl border border-gray-100 flex-row items-start shadow-sm">
                                <View className="bg-blue-50 p-2 rounded-lg">
                                    <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
                                </View>
                                <Text className="flex-1 ml-3 text-gray-500 text-[11px] leading-5">
                                    Ao alterar sua senha, você garante que sua conta continue protegida. O Salão Amanda usa os servidores seguros do Google para processar sua senha.
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </ThemedView>
        </TouchableWithoutFeedback>
    );
}
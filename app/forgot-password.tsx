import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { auth } from "@/config/firebase"; // Importando sua config
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth"; // Função real do Firebase
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { toast } from "sonner-native";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        // Validação de formato de e-mail
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(email.trim())) {
            toast.error("E-mail inválido", {
                description: "Por favor, insira um e-mail válido para continuar."
            });
            return;
        }

        setLoading(true);

        try {
            // Chamada Real ao Firebase Auth
            await sendPasswordResetEmail(auth, email.trim());

            toast.success("E-mail enviado!", {
                description: `Enviamos as instruções para: ${email.toLowerCase()}`
            });

            // Retorna ao login após o sucesso
            setTimeout(() => {
                router.back();
            }, 2500);

        } catch (error: any) {
            console.error("Erro ao recuperar senha:", error.code);

            let errorMessage = "Ocorreu um erro. Tente novamente mais tarde.";

            if (error.code === 'auth/user-not-found') {
                errorMessage = "Este e-mail não está cadastrado em nossa base.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "O endereço de e-mail não é válido.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Muitas tentativas. Tente novamente em alguns minutos.";
            }

            toast.error("Erro na recuperação", {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

                    {/* Cabeçalho Rosa */}
                    <Animated.View
                        entering={FadeInUp.duration(600)}
                        className="bg-pink-500 p-6 pt-12 rounded-b-[40px] shadow-md mb-8"
                    >
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mb-4 w-10 h-10 items-center justify-center rounded-full bg-white/20 active:bg-white/30"
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>

                        <ThemedText type="title" className="text-white text-3xl">Recuperar Senha</ThemedText>
                        <ThemedText className="text-pink-100 mt-2 text-lg">
                            Não se preocupe, vamos te ajudar!
                        </ThemedText>
                    </Animated.View>

                    <View className="px-6">
                        <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                            <View className="items-center mb-8">
                                <View className="bg-pink-50 p-6 rounded-full">
                                    <Ionicons name="key-outline" size={40} color="#ec4899" />
                                </View>
                            </View>

                            <ThemedText className="text-gray-500 text-center mb-8 px-4 leading-6">
                                Digite o e-mail associado à sua conta. Enviaremos um link para você redefinir sua senha com segurança.
                            </ThemedText>

                            {/* Campo de E-mail */}
                            <View className="mb-8">
                                <ThemedText className="text-gray-700 font-bold mb-2 ml-1 uppercase text-[10px] tracking-widest">
                                    E-mail de Cadastro
                                </ThemedText>
                                <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-100 p-4 shadow-sm">
                                    <Ionicons name="mail-outline" size={20} color="#ec4899" />
                                    <TextInput
                                        placeholder="seu@email.com"
                                        placeholderTextColor="#9ca3af"
                                        className="flex-1 text-gray-800 ml-3 font-medium"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        value={email}
                                        onChangeText={setEmail}
                                    />
                                </View>
                            </View>

                            {/* Botão de Ação */}
                            <TouchableOpacity
                                onPress={handleResetPassword}
                                disabled={loading}
                                className={`h-16 rounded-2xl items-center justify-center shadow-lg ${loading ? "bg-pink-300" : "bg-pink-500 active:bg-pink-600"
                                    }`}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <ThemedText className="text-white font-bold text-lg">
                                        Enviar Link de Recuperação
                                    </ThemedText>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="mt-8 items-center"
                            >
                                <ThemedText className="text-gray-400">
                                    Lembrou a senha? <ThemedText className="text-pink-600 font-bold">Voltar ao Login</ThemedText>
                                </ThemedText>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}
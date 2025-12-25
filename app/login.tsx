import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { auth, db } from "@/config/firebase"; // Importar db para salvar o token
import Constants from "expo-constants";
import * as Notifications from "expo-notifications"; // Importar Expo Notifications
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore"; // Importar funções do Firestore
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import Animated, { FadeInDown } from 'react-native-reanimated';
import { toast } from 'sonner-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Função para buscar o Token de Notificação ---
  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;

    return token;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Ops!", { description: "Por favor, preencha todos os campos." });
      return;
    }

    setLoading(true);
    try {
      // 1. Realiza o login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Tenta capturar o token de notificação
      const token = await registerForPushNotificationsAsync();

      // 3. Salva o token no Firestore do usuário
      if (token) {
        await updateDoc(doc(db, "users", user.uid), {
          pushToken: token
        });
      }

      toast.success("Seja bem-vindo(a) ao Salão Amanda", {
        description: "Login realizado com sucesso."
      });

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Erro ao fazer login:", error.code);
      let errorMessage = "Ocorreu um erro. Tente novamente.";

      if (error.code === 'auth/invalid-email') errorMessage = "E-mail inválido.";
      else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "E-mail ou senha incorretos.";
      }

      toast.error("Erro no Login", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView className="flex-1 bg-white p-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center items-center"
        >
          <Animated.View
            entering={FadeInDown.delay(200).duration(1000).springify()}
            className="w-full items-center"
          >
            <ThemedText type="title" className="mb-2 text-3xl font-bold text-pink-600">
              Salão Amanda
            </ThemedText>
            <ThemedText className="mb-8 text-gray-500">
              Realce sua beleza conosco
            </ThemedText>
          </Animated.View>

          <View className="w-full">
            <Animated.View entering={FadeInDown.delay(400).duration(1000).springify()}>
              <TextInput
                className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 mb-4 text-base"
                placeholder="E-mail"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base"
                placeholder="Senha"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                onPress={() => router.push("/forgot-password")}
                className="items-end mt-2 mb-6"
              >
                <Text className="text-pink-600 font-medium">Esqueceu a senha?</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(600).duration(1000).springify()}>
              <TouchableOpacity
                className="h-14 w-full items-center justify-center rounded-xl bg-pink-500 shadow-sm active:bg-pink-600"
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-lg font-bold text-white">Entrar</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}
import {
  Quicksand_300Light,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from "@expo-google-fonts/quicksand";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router"; // Trocamos redirect por useRouter
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import "react-native-reanimated";

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from 'sonner-native';

import { auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();

  const [loaded, error] = useFonts({
    Quicksand_300Light,
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // 1. Observador de Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setInitialAuthCheckComplete(true);
    });
    return () => unsubscribe();
  }, []);

  // 2. Lógica de Redirecionamento (Proteção de Rotas)
  useEffect(() => {
    if (!initialAuthCheckComplete || !loaded) return;

    // Verificamos se o usuário está tentando acessar telas de login/cadastro
    // Usamos cast 'as string' para evitar o erro ts(2367)
    const currentPath = segments[0] as string;
    const isAuthPage = currentPath === "login" || currentPath === "register" || currentPath === "forgot-password";

    if (!isAuthenticated && !isAuthPage) {
      // Se não está logado e não está em uma página de login, vai para o login
      router.replace("/login");
    } else if (isAuthenticated && isAuthPage) {
      // Se está logado e tenta ir para o login, vai para a home
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, initialAuthCheckComplete, segments, loaded]);

  useEffect(() => {
    if (error) throw error;
    if (loaded && initialAuthCheckComplete) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, initialAuthCheckComplete]);

  if (!loaded || !initialAuthCheckComplete) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <StatusBar style="auto" />

        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          {/* Definimos as telas explicitamente para evitar erros de navegação */}
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="admin-setup" />
        </Stack>

        <Toaster position="top-center" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
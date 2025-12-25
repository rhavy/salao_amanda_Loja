import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { auth, db } from "@/config/firebase";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Notifications from 'expo-notifications';
import { Tabs } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, doc, getDocs, onSnapshot, query, Timestamp, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribeFirestore: () => void;

    const setupNotifications = async () => {
      if (!currentUser) {
        setRemindersEnabled(false);
        await Notifications.cancelAllScheduledNotificationsAsync();
        return;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const userDocRef = doc(db, "users", currentUser.uid);
      unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRemindersEnabled(data?.notifications?.reminders || false);
        }
      });
    };

    setupNotifications();
    return () => unsubscribeFirestore && unsubscribeFirestore();
  }, [currentUser]);

  useEffect(() => {
    const scheduleReminders = async () => {
      if (!currentUser || !remindersEnabled) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        return;
      }

      await Notifications.cancelAllScheduledNotificationsAsync();

      try {
        const now = Timestamp.now();
        const q = query(
          collection(db, "appointments"),
          where("userId", "==", currentUser.uid),
          where("date", ">", now)
        );

        const querySnapshot = await getDocs(q);

        for (const docSnapshot of querySnapshot.docs) {
          const appointment = docSnapshot.data();
          const appointmentDate = (appointment.date as Timestamp).toDate();
          const notificationDate = new Date(appointmentDate.getTime() - 60 * 60 * 1000);

          if (notificationDate > new Date()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Lembrete do Salão Amanda! 🎀",
                body: `Seu serviço de ${appointment.serviceName} é às ${appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
                data: { appointmentId: docSnapshot.id },
              },
              trigger: {
                type: 'date',
                date: notificationDate,
              } as any,
              identifier: `remind-${docSnapshot.id}`,
            });
          }
        }
      } catch (error) {
        console.error("Erro ao agendar lembretes:", error);
      }
    };

    const timeoutId = setTimeout(scheduleReminders, 2000);
    return () => clearTimeout(timeoutId);
  }, [currentUser, remindersEnabled]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tint,
        tabBarStyle: {
          backgroundColor: Colors[theme].background,
          borderTopWidth: 1,
          borderTopColor: theme === 'light' ? '#f3f4f6' : '#374151',
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarInactiveTintColor: Colors[theme].tabIconDefault,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Financias",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "cash" : "cash-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Serviços",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "cut" : "cut-outline"} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="agendamentos"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "calendar" : "calendar-outline"} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="localizacao"
        options={{
          title: "Salão",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "location" : "location-outline"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
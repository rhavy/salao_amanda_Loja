import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet } from "react-native";

export default function EditProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Editar Perfil</ThemedText>
      <ThemedText>
        Em breve, você poderá editar seus dados aqui.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

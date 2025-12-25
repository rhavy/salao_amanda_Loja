<div align="center">
  <img src="https://raw.githubusercontent.com/user-attachments/assets/52563724-4f02-45e3-9828-912f293b8214" alt="Logo do Salão Amanda" width="150" />
  <h1 style="border-bottom: none;">Salão Amanda Loja</h1>
  <p>
    Aplicativo mobile para agendamento de serviços e compra de produtos do Salão Amanda.
    <br />
    <em>Feito com ❤️ usando React Native & Expo.</em>
  </p>
</div>

---

## ✨ Visão Geral

O **Salão Amanda Loja** é um aplicativo móvel completo, projetado para oferecer uma experiência de agendamento fluida e intuitiva para clientes, além de fornecer uma poderosa ferramenta de gerenciamento para os administradores do salão.

Construído com as tecnologias mais recentes do ecossistema React Native, este projeto serve como um exemplo robusto de um aplicativo de mercado, integrando-se diretamente com o Firebase para autenticação, banco de dados em tempo real e notificações.

## 🚀 Funcionalidades

- **👩‍🎨 Para Clientes:**
  - **Visualização de Serviços:** Explore uma lista completa de serviços oferecidos pelo salão, com detalhes sobre duração e preço.
  - **Agendamento Simplificado:** Marque horários com apenas alguns cliques, diretamente pela lista de serviços.
  - **Gestão de Agendamentos:** Visualize, acompanhe e cancele seus horários marcados.
  - **Loja de Produtos (Em Breve):** Uma seção dedicada à compra dos melhores produtos de beleza.
  - **Perfil de Usuário:** Gerencie suas informações pessoais e foto de perfil.
  - **Notificações:** Receba lembretes automáticos sobre seus agendamentos.

- **⚙️ Para Administradores:**
  - **Painel de Acesso Restrito:** Tela de login exclusiva para administradores.
  - **Gerenciamento de Serviços (Futuro):** Painel para adicionar, editar e remover serviços e produtos.
  - **Visão Geral do Negócio (Futuro):** Dashboards com métricas e insights.

## 🛠️ Tecnologias Utilizadas

- **Framework:** [React Native](https://reactnative.dev/) via [Expo](https://expo.dev/) (SDK 54)
- **Roteamento:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-Based Routing)
- **Estilização:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS para React Native)
- **UI & Animações:** [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Backend & Banco de Dados:** [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)

## 🏁 Começando

Siga os passos abaixo para configurar e executar o projeto em seu ambiente de desenvolvimento local.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS recomendada)
- [Android Studio](https://developer.android.com/studio) (para o emulador Android e SDK)
- Conta no [Firebase](https://firebase.google.com/)

### 1. Instalação

Clone o repositório e instale as dependências:

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd salao_amanda_Loja
npm install
```

### 2. Configuração do Ambiente

O projeto requer algumas configurações de ambiente críticas para funcionar, especialmente a conexão com o Firebase e o Android SDK.

#### a. Android SDK

O Gradle precisa saber onde seu Android SDK está instalado. Crie um arquivo chamado `local.properties` dentro da pasta `android`:

```properties
# D:/git/salao_amanda_Loja/android/local.properties

# Substitua pelo caminho exato do seu SDK no seu computador
sdk.dir=C:\\Users\\<SeuUsuario>\\AppData\\Local\\Android\\Sdk
```

#### b. Firebase

O aplicativo precisa se conectar ao seu projeto Firebase.

1.  **Recrie os arquivos nativos:** Para garantir que o nome do pacote (`com.salaoamandaloja.app`) está correto, execute:
    ```bash
    npx expo prebuild --clean
    ```
    *Este comando irá deletar e recriar as pastas `android` e `ios`.*

2.  **Baixe o `google-services.json`:**
    - Acesse o [Console do Firebase](https://console.firebase.google.com/).
    - Vá em **Configurações do Projeto > Seus apps**.
    - Selecione (ou adicione) o aplicativo Android com o nome de pacote `com.salaoamandaloja.app`.
    - Baixe o arquivo `google-services.json` atualizado.

3.  **Posicione o arquivo:** Coloque o arquivo `google-services.json` que você baixou na raiz do projeto.

### 3. Executando o Aplicativo

Após a configuração, você pode iniciar o aplicativo:

```bash
# Inicia o servidor de desenvolvimento
npx expo start

# Para rodar a versão nativa (recomendado após o prebuild)
npx expo run:android
```

## 📂 Estrutura do Projeto

```
.
├── android/          # Código nativo Android (gerado pelo prebuild)
├── app/              # Telas e roteamento (Expo Router)
│   ├── (tabs)/       # Telas principais com navegação por abas
│   └── ...           # Outras telas (login, etc.)
├── assets/           # Imagens e fontes
├── components/       # Componentes reutilizáveis da UI
├── config/           # Configuração do Firebase
├── constants/        # Cores, dados estáticos
└── hooks/            # Hooks customizados
```

## 🗺️ Roadmap

- [ ] Implementar sistema de pagamento para a loja.
- [ ] Criar perfis detalhados para os profissionais do salão.
- [ ] Adicionar um sistema de avaliação e feedback dos serviços.
- [ ] Desenvolver o painel de administração completo.

---

<p align="center">Feito com paixão e código.</p>
// constants/data.ts

export interface Service {
  id: string; // String é melhor para chaves de lista e compatibilidade com rotas
  name: string;
  price: number;
  duration: number; // em minutos
  category: string;
}

export const BUSINESS_HOURS = {
  weekdays: { open: "09:00", close: "20:00" },
  saturday: { open: "09:00", close: "18:00" },
  sunday: { open: null, close: null }, // Fechado
};

export const SERVICES: Service[] = [
  {
    id: "1",
    name: "Corte Feminino",
    price: 80.0,
    duration: 60,
    category: "Cabelo",
  },
  {
    id: "2",
    name: "Corte Masculino",
    price: 50.0,
    duration: 30,
    category: "Cabelo",
  },
  {
    id: "3",
    name: "Escova Modeladora",
    price: 45.0,
    duration: 45,
    category: "Cabelo",
  },
  {
    id: "4",
    name: "Hidratação Profunda",
    price: 120.0,
    duration: 90,
    category: "Tratamento",
  },
  {
    id: "5",
    name: "Manicure",
    price: 35.0,
    duration: 40,
    category: "Unhas",
  },
  {
    id: "6",
    name: "Pedicure",
    price: 35.0,
    duration: 40,
    category: "Unhas",
  },
  {
    id: "7",
    name: "Manicure + Pedicure",
    price: 65.0,
    duration: 80,
    category: "Unhas",
  },
  {
    id: "8",
    name: "Coloração Completa",
    price: 250.0,
    duration: 120,
    category: "Coloração",
  },
];
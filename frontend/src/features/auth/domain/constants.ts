// Constantes métier pour l'authentification

// Questions de sécurité prédéfinies (données métier)
export const SECURITY_QUESTIONS = [
  {
    value: "pet_name",
    label: "Quel était le nom de votre premier animal de compagnie ?",
  },
  { value: "birth_city", label: "Dans quelle ville êtes-vous né(e) ?" },
  {
    value: "mother_maiden",
    label: "Quel est le nom de jeune fille de votre mère ?",
  },
  {
    value: "first_school",
    label: "Quel était le nom de votre première école ?",
  },
  {
    value: "favorite_teacher",
    label: "Quel était le nom de votre professeur préféré ?",
  },
  {
    value: "childhood_friend",
    label: "Quel était le nom de votre meilleur ami d'enfance ?",
  },
  { value: "first_job", label: "Quel était votre premier emploi ?" },
  {
    value: "favorite_book",
    label: "Quel est le titre de votre livre préféré ?",
  },
  {
    value: "dream_destination",
    label: "Quelle est votre destination de voyage de rêve ?",
  },
  { value: "childhood_nickname", label: "Quel était votre surnom d'enfance ?" },
] as const;

// Type pour les valeurs des questions de sécurité
export type SecurityQuestionValue =
  (typeof SECURITY_QUESTIONS)[number]["value"];

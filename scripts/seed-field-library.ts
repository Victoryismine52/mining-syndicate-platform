#!/usr/bin/env tsx

import { db } from "../server/db";
import { fieldLibrary } from "../shared/schema";

const fieldLibraryData = [
  {
    name: "email",
    label: "Email Address",
    category: "contact",
    dataType: "email",
    defaultPlaceholder: "john.doe@example.com",
    defaultValidation: { required: true, pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" },
    translations: {
      "es": { label: "Dirección de Correo", placeholder: "juan.perez@ejemplo.com" },
      "fr": { label: "Adresse E-mail", placeholder: "jean.dupont@exemple.com" }
    },
    isSystemField: true
  },
  {
    name: "firstName",
    label: "First Name",
    category: "contact",
    dataType: "text",
    defaultPlaceholder: "John",
    defaultValidation: { required: true, minLength: 2, maxLength: 50 },
    translations: {
      "es": { label: "Nombre", placeholder: "Juan" },
      "fr": { label: "Prénom", placeholder: "Jean" }
    },
    isSystemField: true
  },
  {
    name: "lastName",
    label: "Last Name",
    category: "contact",
    dataType: "text",
    defaultPlaceholder: "Doe",
    defaultValidation: { required: true, minLength: 2, maxLength: 50 },
    translations: {
      "es": { label: "Apellido", placeholder: "Pérez" },
      "fr": { label: "Nom de famille", placeholder: "Dupont" }
    },
    isSystemField: true
  },
  {
    name: "phone",
    label: "Phone Number",
    category: "contact",
    dataType: "text",
    defaultPlaceholder: "+1 (555) 123-4567",
    defaultValidation: { required: false, pattern: "^[\\+]?[1-9][\\d]{0,14}$" },
    translations: {
      "es": { label: "Número de Teléfono", placeholder: "+34 612 345 678" },
      "fr": { label: "Numéro de Téléphone", placeholder: "+33 6 12 34 56 78" }
    },
    isSystemField: true
  },
  {
    name: "company",
    label: "Company",
    category: "business",
    dataType: "text",
    defaultPlaceholder: "Acme Corporation",
    defaultValidation: { required: false, maxLength: 100 },
    translations: {
      "es": { label: "Empresa", placeholder: "Corporación Ejemplo" },
      "fr": { label: "Entreprise", placeholder: "Société Exemple" }
    },
    isSystemField: true
  },
  {
    name: "jobTitle",
    label: "Job Title",
    category: "business",
    dataType: "text",
    defaultPlaceholder: "Chief Executive Officer",
    defaultValidation: { required: false, maxLength: 100 },
    translations: {
      "es": { label: "Puesto de Trabajo", placeholder: "Director Ejecutivo" },
      "fr": { label: "Poste", placeholder: "Directeur Général" }
    },
    isSystemField: true
  },
  {
    name: "website",
    label: "Website",
    category: "business",
    dataType: "text",
    defaultPlaceholder: "https://www.example.com",
    defaultValidation: { required: false, pattern: "^https?://.+" },
    translations: {
      "es": { label: "Sitio Web", placeholder: "https://www.ejemplo.com" },
      "fr": { label: "Site Web", placeholder: "https://www.exemple.com" }
    },
    isSystemField: true
  },
  {
    name: "message",
    label: "Message",
    category: "content",
    dataType: "textarea",
    defaultPlaceholder: "Please tell us about your interest...",
    defaultValidation: { required: false, maxLength: 1000 },
    translations: {
      "es": { label: "Mensaje", placeholder: "Por favor cuéntanos sobre tu interés..." },
      "fr": { label: "Message", placeholder: "Veuillez nous parler de votre intérêt..." }
    },
    isSystemField: true
  },
  {
    name: "interestedIn",
    label: "Interested In",
    category: "preferences",
    dataType: "array",
    defaultValidation: {
      required: true,
      description: "Please choose one or more options that best describe your interest:",
      options: ["Mining Pool Investment", "Lending Pool Investment", "General Information", "Partnership Opportunities"],
      itemType: "string" as const,
      minItems: 1
    },
    translations: {
      "es": {
        label: "Interesado En",
        description: "Por favor elige una o más opciones que mejor describan tu interés:",
        options: ["Inversión en Pool de Minería", "Inversión en Pool de Préstamos", "Información General", "Oportunidades de Asociación"]
      },
      "fr": {
        label: "Intéressé Par",
        description: "Veuillez choisir une ou plusieurs options qui décrivent le mieux votre intérêt:",
        options: ["Investissement Pool Minier", "Investissement Pool de Prêt", "Informations Générales", "Opportunités de Partenariat"]
      }
    },
    isSystemField: true
  },
  {
    name: "interests",
    label: "Interests",
    category: "preferences",
    dataType: "array",
    defaultPlaceholder: "Select your interests",
    defaultValidation: { required: false },
    translations: {
      "es": { label: "Intereses", placeholder: "Selecciona tus intereses" },
      "fr": { label: "Intérêts", placeholder: "Sélectionnez vos intérêts" }
    },
    isSystemField: true
  },
  {
    name: "investmentAmount",
    label: "Investment Amount",
    category: "financial",
    dataType: "number",
    defaultPlaceholder: "50000",
    defaultValidation: { required: false, min: 0 },
    translations: {
      "es": { label: "Cantidad de Inversión", placeholder: "50000" },
      "fr": { label: "Montant d'Investissement", placeholder: "50000" }
    },
    isSystemField: true
  },
  {
    name: "formType",
    label: "Form Type",
    category: "system",
    dataType: "text",
    defaultValidation: { required: true },
    translations: {
      "es": { label: "Tipo de Formulario" },
      "fr": { label: "Type de Formulaire" }
    },
    isSystemField: true
  }
];

async function seedFieldLibrary() {
  console.log("Seeding field library...");
  
  try {
    // Clear existing data
    await db.delete(fieldLibrary);
    console.log("Cleared existing field library data");

    // Insert new seed data
    await db.insert(fieldLibrary).values(fieldLibraryData);
    console.log(`Successfully seeded ${fieldLibraryData.length} field library items`);

    // Verify insertion
    const count = await db.select().from(fieldLibrary);
    console.log(`Field library now contains ${count.length} items`);
    
  } catch (error) {
    console.error("Error seeding field library:", error);
    process.exit(1);
  }
}

// Run the seed function if this script is executed directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedFieldLibrary().then(() => {
    console.log("Field library seeding completed!");
    process.exit(0);
  });
}
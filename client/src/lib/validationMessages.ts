export const validationMessages: Record<string, {
  required: string;
  invalidEmail: string;
  invalidPhone: string;
  invalidNumber: string;
  selectOption: string;
  selectOneOption: string;
  atLeastOne: string;
}> = {
  en: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    invalidNumber: 'Please enter a valid number',
    selectOption: 'Please select an option',
    selectOneOption: 'Please select one of the available options',
    atLeastOne: 'At least one item is required',
  },
  es: {
    required: 'Este campo es obligatorio',
    invalidEmail: 'Por favor, introduce un correo electrónico válido',
    invalidPhone: 'Por favor, introduce un número de teléfono válido',
    invalidNumber: 'Por favor, introduce un número válido',
    selectOption: 'Por favor, selecciona una opción',
    selectOneOption: 'Por favor, selecciona una de las opciones disponibles',
    atLeastOne: 'Se requiere al menos un elemento',
  },
};

// Форматирование телефона в формат +7 (XXX) XXX-XX-XX
export const formatPhone = (value: string): string => {
  // Убираем всё кроме цифр
  let digits = value.replace(/\D/g, '');
  
  // Если начинается с 8, заменяем на 7
  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }
  
  // Если не начинается с 7, добавляем
  if (digits.length > 0 && !digits.startsWith('7')) {
    digits = '7' + digits;
  }
  
  // Ограничиваем 11 цифрами
  digits = digits.slice(0, 11);
  
  // Форматируем
  if (digits.length === 0) return '';
  if (digits.length <= 1) return '+7';
  if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
  if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
};

// Валидация телефона (должно быть 11 цифр)
export const validatePhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11;
};

// Получить только цифры
export const getPhoneDigits = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

import { useState, useEffect } from 'react';
import api from '../services/api';

export interface TemplateVariable {
  name: string;
  description: string;
}

export const useTemplateVariables = () => {
  const [variables, setVariables] = useState<TemplateVariable[]>([]);

  useEffect(() => {
    const fetchVariables = async () => {
      try {
        const response = await api.get('/mail/templates/variables');
        setVariables(response.data);
      } catch (error) {
        console.error('Failed to fetch variables', error);
      }
    };
    fetchVariables();
  }, []);

  return variables;
};
